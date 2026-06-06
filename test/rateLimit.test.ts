import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { rateLimit } from "../src/middleware/rateLimit.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

function appWith(now: () => number, max = 2, windowMs = 1000) {
  const app = express();
  app.use(rateLimit({ max, windowMs, now, keyGenerator: () => "fixed-key" }));
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe("rateLimit", () => {
  it("allows requests up to the limit", async () => {
    const app = appWith(() => 0, 2);
    const a = await request(app).get("/ping");
    const b = await request(app).get("/ping");
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(b.headers["x-ratelimit-remaining"]).toBe("0");
  });

  it("blocks requests over the limit with 429 and Retry-After", async () => {
    const app = appWith(() => 0, 2);
    await request(app).get("/ping");
    await request(app).get("/ping");
    const blocked = await request(app).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("TooManyRequestsError");
    expect(blocked.headers["retry-after"]).toBeTruthy();
  });

  it("resets the window after windowMs elapses", async () => {
    let clock = 0;
    const app = appWith(() => clock, 1, 1000);
    expect((await request(app).get("/ping")).status).toBe(200);
    expect((await request(app).get("/ping")).status).toBe(429);
    clock = 1001;
    expect((await request(app).get("/ping")).status).toBe(200);
  });

  it("sets the X-RateLimit-Limit header", async () => {
    const app = appWith(() => 0, 5);
    const res = await request(app).get("/ping");
    expect(res.headers["x-ratelimit-limit"]).toBe("5");
  });
});
