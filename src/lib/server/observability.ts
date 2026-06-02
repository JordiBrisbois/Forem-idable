import { AsyncLocalStorage } from "async_hooks";
import { createHmac, randomUUID } from "crypto";
import { NextRequest } from "next/server";

type ObservabilityLevel = "info" | "warn" | "error";

interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  userId?: number;
}

const requestContextStore = new AsyncLocalStorage<RequestLogContext>();

function hashUserId(userId: number): string {
  const secret = process.env.AUDIT_HASH_SECRET;
  if (!secret) throw new Error("AUDIT_HASH_SECRET must be set");
  return createHmac("sha256", secret).update(String(userId)).digest("hex").slice(0, 16);
}

function isTimingEnabled() {
  return process.env.SERVER_TIMING_LOGS?.trim().toLowerCase() === "true";
}

function shouldEmitEvent(level: ObservabilityLevel) {
  if (level === "error" || level === "warn") {
    return true;
  }

  const raw = process.env.SERVER_AUDIT_LOGS?.trim().toLowerCase();
  if (!raw) {
    return true;
  }

  return raw !== "false";
}

const SENSITIVE_VALUE_PATTERNS = [
  /^eyJ[A-Za-z0-9_-]{10,}/, // JWT-like tokens
  /^frm_live_/,               // API key prefixes
  /^Bearer /i,               // Auth headers
];

function redactValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    if (pattern.test(value)) return "[redacted]";
  }
  return value;
}

function redactKey(key: string, value: unknown) {
  const normalizedKey = key.toLowerCase();
  const sensitive =
    normalizedKey.includes("password") ||
    normalizedKey.includes("token") ||
    normalizedKey.includes("secret") ||
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("cookie") ||
    normalizedKey.includes("email");

  if (sensitive) {
    return "[redacted]";
  }

  return redactValue(value);
}

function sanitizeMeta(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined;

  return Object.fromEntries(
    Object.entries(meta)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (/userId/i.test(key) && typeof value === "number") {
          return [key, hashUserId(value)];
        }
        return [key, redactKey(key, value)];
      })
  );
}

export function createRequestContext(request: NextRequest, userId?: number): RequestLogContext {
  return {
    requestId: request.headers.get("x-request-id")?.trim() || randomUUID(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    userId,
  };
}

export function getCurrentRequestContext() {
  return requestContextStore.getStore() ?? null;
}

export async function withRequestContext<T>(
  request: NextRequest,
  userIdOrRun: number | undefined | ((context: RequestLogContext) => Promise<T>),
  maybeRun?: (context: RequestLogContext) => Promise<T>
) {
  const userId = typeof userIdOrRun === "number" ? userIdOrRun : undefined;
  const run = typeof userIdOrRun === "function" ? userIdOrRun : maybeRun!;
  const context = createRequestContext(request, userId);
  return requestContextStore.run(context, () => run(context));
}

export function logServerEvent(input: {
  category: string;
  action: string;
  level?: ObservabilityLevel;
  durationMs?: number;
  meta?: Record<string, unknown>;
  timing?: boolean;
}) {
  const level = input.level ?? "info";
  const context = getCurrentRequestContext();

  if (input.timing) {
    if (!isTimingEnabled()) return;
  } else if (!shouldEmitEvent(level)) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    category: input.category,
    action: input.action,
    requestId: context?.requestId,
    method: context?.method,
    path: context?.path,
    ip: context?.ip,
    userAgent: context?.userAgent,
    userId: context?.userId ? hashUserId(context.userId) : undefined,
    durationMs:
      typeof input.durationMs === "number" ? Math.round(input.durationMs * 100) / 100 : undefined,
    meta: sanitizeMeta(input.meta),
  };

  console.log(JSON.stringify(payload));
}

export async function measureServerOperation<T>(input: {
  category: string;
  action: string;
  meta?: Record<string, unknown>;
  timing?: boolean;
  run: () => Promise<T>;
}) {
  const start = performance.now();

  try {
    const result = await input.run();
    logServerEvent({
      category: input.category,
      action: input.action,
      durationMs: performance.now() - start,
      meta: input.meta,
      timing: input.timing ?? true,
    });
    return result;
  } catch (error) {
    logServerEvent({
      category: input.category,
      action: input.action,
      level: "error",
      durationMs: performance.now() - start,
      meta: {
        ...input.meta,
        error: error instanceof Error ? error.message : "unknown",
      },
      timing: input.timing ?? true,
    });
    throw error;
  }
}
