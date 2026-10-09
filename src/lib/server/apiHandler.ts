import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { requireAdminAccess, requireCoachAccess } from "@/lib/server/coach";
import { type CoachCapableUser } from "@/lib/server/coachGroups";
import { requireExternalApiAccess } from "@/lib/server/externalApiRoute";
import { logServerEvent, withRequestContext } from "@/lib/server/observability";
import { rejectCrossOriginRequest } from "@/lib/server/requestOrigin";
import { readValidatedJson } from "@/lib/server/requestSchemas";
import { handleApiError } from "@/lib/server/errors";
import { AuthUser } from "@/types/auth";
import { ExternalApiActor } from "@/types/externalApi";

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<RouteParams> };
type Access = "user" | "coach" | "admin";

type BodyOf<T> = T extends z.ZodTypeAny ? z.infer<T> : undefined;

type UserFor<A extends Access> = A extends "admin"
  ? AuthUser & { role: "admin" }
  : A extends "coach"
    ? CoachCapableUser
    : AuthUser;

async function resolveAccess(access: Access): Promise<AuthUser | null> {
  if (access === "admin") return requireAdminAccess();
  if (access === "coach") return requireCoachAccess();
  return getCurrentUser();
}

/**
 * Wraps a cookie-session API handler: request context, CSRF, access guard,
 * optional Zod body validation, and consistent error mapping.
 */
export function withSessionHandler<
  A extends Access,
  TBody extends z.ZodTypeAny | undefined = undefined
>(
  options: {
    access: A;
    body?: TBody;
    csrf?: boolean;
    bodyErrorMessage?: string;
    fallbackMessage: string;
  },
  handler: (ctx: {
    request: NextRequest;
    user: UserFor<A>;
    body: BodyOf<TBody>;
    params: RouteParams;
  }) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
    return withRequestContext(request, async () => {
      const params = context ? await context.params : {};

      try {
        if (options.csrf !== false && request.method !== "GET") {
          const forbidden = rejectCrossOriginRequest(request);
          if (forbidden) return forbidden;
        }

        const user = await resolveAccess(options.access);
        if (!user) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let body = undefined as BodyOf<TBody>;
        if (options.body) {
          const parsed = await readValidatedJson(request, options.body);
          if (!parsed.success) {
            return NextResponse.json(
              { error: options.bodyErrorMessage ?? parsed.error },
              { status: 400 }
            );
          }
          body = parsed.data as BodyOf<TBody>;
        }

        return await handler({ request, user: user as UserFor<A>, body, params });
      } catch (error) {
        logServerEvent({
          category: options.access,
          action: "request_failed",
          level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
          meta: {
            path: request.nextUrl.pathname,
            error: error instanceof Error ? error.message : "unknown",
          },
        });
        return handleApiError(error, { fallbackMessage: options.fallbackMessage });
      }
    });
  };
}

/** Wraps a Bearer-key external API handler. */
export function withExternalHandler<TBody extends z.ZodTypeAny | undefined = undefined>(
  options: { body?: TBody; bodyErrorMessage?: string; fallbackMessage: string },
  handler: (ctx: {
    request: NextRequest;
    actor: ExternalApiActor;
    body: BodyOf<TBody>;
    params: RouteParams;
  }) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
    return withRequestContext(request, async () => {
      const params = context ? await context.params : {};

      try {
        const actor = await requireExternalApiAccess();
        if (actor instanceof NextResponse) return actor;

        let body = undefined as BodyOf<TBody>;
        if (options.body) {
          const parsed = await readValidatedJson(request, options.body);
          if (!parsed.success) {
            return NextResponse.json(
              { error: options.bodyErrorMessage ?? parsed.error },
              { status: 400 }
            );
          }
          body = parsed.data as BodyOf<TBody>;
        }

        return await handler({ request, actor, body, params });
      } catch (error) {
        logServerEvent({
          category: "external",
          action: "request_failed",
          level: error instanceof Error && error.message === "Forbidden" ? "warn" : "error",
          meta: {
            path: request.nextUrl.pathname,
            error: error instanceof Error ? error.message : "unknown",
          },
        });
        return handleApiError(error, { fallbackMessage: options.fallbackMessage });
      }
    });
  };
}
