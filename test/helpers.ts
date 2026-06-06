import type { Express } from "express";
import request from "supertest";
import { createApp, type AppOptions } from "../src/app.js";
import { loadConfig, type AppConfig } from "../src/config.js";

export const TEST_SECRET = "test-secret-do-not-use-in-prod";

/** Build a test config with deterministic, test-friendly defaults. */
export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig({ NODE_ENV: "test" } as NodeJS.ProcessEnv),
    jwtSecret: TEST_SECRET,
    logRequests: false,
    ...overrides,
  };
}

/** Build a fully-wired app for tests (rate limit off, logs silenced). */
export function buildTestApp(options: AppOptions = {}): Express {
  return createApp({
    config: testConfig(),
    disableRateLimit: true,
    logSink: () => {},
    ...options,
  });
}

/** Register a user and return a Bearer token for them. */
export async function registerAndLogin(
  app: Express,
  email: string,
  password: string,
  role: "user" | "admin" = "user",
): Promise<string> {
  await request(app).post("/auth/register").send({ email, password, role });
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password });
  return res.body.data.token as string;
}
