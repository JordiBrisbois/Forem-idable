import { z } from "zod";

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const optionalNumber = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : value;
  },
  z.number().int().positive().optional()
);

const booleanFlag = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase() === "true";
}, z.boolean().optional());

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis (connexion PostgreSQL)"),
  DB_SSL_MODE: optionalString,
  DB_SSL_CA_PEM: optionalString,
  DB_SSL_CA_BASE64: optionalString,
  DB_SLOW_QUERY_MS: optionalNumber,

  REDIS_URL: optionalString,
  SERVER_TIMING_LOGS: optionalString,
  SERVER_AUDIT_LOGS: optionalString,

  AUDIT_HASH_SECRET: z
    .string()
    .min(8, "AUDIT_HASH_SECRET est requis (min 8 caractères, idéalement 32 octets hex)"),

  SCOUT_WORKER_ENABLED: optionalString,

  PASSWORD_RESET_ENABLED: booleanFlag,
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalString,
  RESEND_REPLY_TO: optionalString,

  ADZUNA_ENABLED: booleanFlag,
  ADZUNA_APP_ID: optionalString,
  ADZUNA_APP_KEY: optionalString,
  ADZUNA_COUNTRY: optionalString,

  PASSWORD_RESET_RETENTION_DAYS: optionalNumber,
  SEARCH_HISTORY_RETENTION_DAYS: optionalNumber,
  DATA_EXPORT_RETENTION_DAYS: optionalNumber,
  MESSAGE_RETENTION_MONTHS: optionalNumber,
  AUDIT_LOG_RETENTION_MONTHS: optionalNumber,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(env: NodeJS.ProcessEnv = process.env) {
  return serverEnvSchema.safeParse(env);
}

let hasAsserted = false;

/**
 * Fail-fast validation of server configuration. Called from instrumentation at
 * server boot (never during `next build`) so misconfiguration surfaces early
 * instead of silently falling back to neutral defaults.
 */
export function assertServerEnv(env: NodeJS.ProcessEnv = process.env) {
  if (hasAsserted) return;

  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(racine)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuration d'environnement invalide:\n${issues}`);
  }

  hasAsserted = true;
}
