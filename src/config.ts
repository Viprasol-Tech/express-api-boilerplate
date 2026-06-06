/**
 * Centralized, typed application configuration.
 *
 * Reads from `process.env` once at import time and validates/coerces values so
 * the rest of the codebase consumes a single strongly-typed object instead of
 * scattering `process.env` lookups (and stringly-typed bugs) everywhere.
 */

export interface AppConfig {
  /** Runtime environment. */
  env: "development" | "test" | "production";
  /** TCP port the standalone server binds to. */
  port: number;
  /** Secret used to sign/verify JWTs (HMAC-SHA256). */
  jwtSecret: string;
  /** Token lifetime in seconds. */
  jwtExpiresInSeconds: number;
  /** Max requests allowed per window, per client key. */
  rateLimitMax: number;
  /** Rate-limit window length in milliseconds. */
  rateLimitWindowMs: number;
  /** Default page size for paginated list endpoints. */
  defaultPageSize: number;
  /** Hard upper bound on page size a client may request. */
  maxPageSize: number;
  /** Whether request logging is enabled. */
  logRequests: boolean;
}

function readString(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
}

function readInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`Config error: ${key} must be an integer, got "${raw}"`);
  }
  return parsed;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function readEnv(): AppConfig["env"] {
  const raw = readString("NODE_ENV", "development");
  if (raw === "development" || raw === "test" || raw === "production") {
    return raw;
  }
  return "development";
}

/**
 * Builds a config object from the current environment. Exposed as a function so
 * tests can construct isolated configs without touching the module singleton.
 */
export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const previous = process.env;
  process.env = env;
  try {
    return {
      env: readEnv(),
      port: readInt("PORT", 3000),
      jwtSecret: readString("JWT_SECRET", "dev-insecure-secret-change-me"),
      jwtExpiresInSeconds: readInt("JWT_EXPIRES_IN", 3600),
      rateLimitMax: readInt("RATE_LIMIT_MAX", 100),
      rateLimitWindowMs: readInt("RATE_LIMIT_WINDOW_MS", 60_000),
      defaultPageSize: readInt("DEFAULT_PAGE_SIZE", 20),
      maxPageSize: readInt("MAX_PAGE_SIZE", 100),
      logRequests: readBool("LOG_REQUESTS", true),
    };
  } finally {
    process.env = previous;
  }
}

/** Process-wide configuration singleton. */
export const config: AppConfig = loadConfig();
