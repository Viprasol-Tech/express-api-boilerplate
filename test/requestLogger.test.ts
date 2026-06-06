import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requestLogger, type RequestLog } from "../src/middleware/requestLogger.js";

function appWith(sink: (e: RequestLog) => void) {
  const app = express();
  app.use(requestLogger({ sink, now: (() => {
    let t = 0;
    return () => (t += 5);
  })() }));
  app.get("/ping", (_req, res) => res.status(201).json({ ok: true }));
  return app;
}

describe("requestLogger", () => {
  it("emits one structured log per request with status and duration", async () => {
    const logs: RequestLog[] = [];
    const app = appWith((e) => logs.push(e));

    const res = await request(app).get("/ping");
    expect(res.status).toBe(201);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ method: "GET", path: "/ping", status: 201 });
    expect(typeof logs[0].durationMs).toBe("number");
    expect(logs[0].requestId).toBeTruthy();
  });

  it("echoes a generated X-Request-Id header", async () => {
    const app = appWith(() => {});
    const res = await request(app).get("/ping");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("propagates an inbound x-request-id", async () => {
    const logs: RequestLog[] = [];
    const app = appWith((e) => logs.push(e));
    const res = await request(app)
      .get("/ping")
      .set("x-request-id", "corr-123");
    expect(res.headers["x-request-id"]).toBe("corr-123");
    expect(logs[0].requestId).toBe("corr-123");
  });
});
