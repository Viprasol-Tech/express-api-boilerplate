import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("provides sensible defaults", () => {
    const cfg = loadConfig({} as NodeJS.ProcessEnv);
    expect(cfg.env).toBe("development");
    expect(cfg.port).toBe(3000);
    expect(cfg.rateLimitMax).toBe(100);
    expect(cfg.defaultPageSize).toBe(20);
    expect(cfg.maxPageSize).toBe(100);
  });

  it("reads and coerces values from the environment", () => {
    const cfg = loadConfig({
      NODE_ENV: "production",
      PORT: "8080",
      JWT_SECRET: "abc",
      RATE_LIMIT_MAX: "5",
      LOG_REQUESTS: "false",
    } as NodeJS.ProcessEnv);
    expect(cfg.env).toBe("production");
    expect(cfg.port).toBe(8080);
    expect(cfg.jwtSecret).toBe("abc");
    expect(cfg.rateLimitMax).toBe(5);
    expect(cfg.logRequests).toBe(false);
  });

  it("throws on a non-integer numeric env var", () => {
    expect(() => loadConfig({ PORT: "not-a-number" } as NodeJS.ProcessEnv)).toThrow(
      /must be an integer/,
    );
  });

  it("falls back to development for an unknown NODE_ENV", () => {
    const cfg = loadConfig({ NODE_ENV: "staging" } as NodeJS.ProcessEnv);
    expect(cfg.env).toBe("development");
  });

  it("does not mutate process.env", () => {
    const before = process.env.PORT;
    loadConfig({ PORT: "9999" } as NodeJS.ProcessEnv);
    expect(process.env.PORT).toBe(before);
  });
});
