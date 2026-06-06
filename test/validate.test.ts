import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { validateBody, validateQuery } from "../src/middleware/validate.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

function bodyApp() {
  const app = express();
  app.use(express.json());
  app.post(
    "/x",
    validateBody({
      name: { type: "string", required: true, min: 2, max: 5 },
      count: { type: "number", min: 0, max: 10 },
      kind: { type: "string", enum: ["a", "b"] },
      flag: { type: "boolean" },
    }),
    (_req, res) => res.json({ ok: true }),
  );
  app.use(errorHandler);
  return app;
}

function queryApp() {
  const app = express();
  app.get(
    "/x",
    validateQuery({
      page: { type: "number", min: 1 },
      active: { type: "boolean" },
    }),
    (req, res) => res.json({ query: req.query }),
  );
  app.use(errorHandler);
  return app;
}

describe("validateBody", () => {
  it("accepts a valid body", async () => {
    const res = await request(bodyApp())
      .post("/x")
      .send({ name: "abc", count: 3, kind: "a", flag: true });
    expect(res.status).toBe(200);
  });

  it("enforces max length on strings", async () => {
    const res = await request(bodyApp()).post("/x").send({ name: "toolong" });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain("'name' must have length <= 5");
  });

  it("enforces max on numbers", async () => {
    const res = await request(bodyApp())
      .post("/x")
      .send({ name: "ab", count: 99 });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain("'count' must be <= 10");
  });

  it("enforces enum membership", async () => {
    const res = await request(bodyApp())
      .post("/x")
      .send({ name: "ab", kind: "z" });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d: string) => d.includes("one of"))).toBe(true);
  });

  it("rejects a non-object body", async () => {
    const res = await request(bodyApp())
      .post("/x")
      .set("content-type", "application/json")
      .send("[]");
    expect(res.status).toBe(400);
  });
});

describe("validateQuery", () => {
  it("coerces numeric and boolean query params", async () => {
    const res = await request(queryApp()).get("/x?page=2&active=true");
    expect(res.status).toBe(200);
    expect(res.body.query.page).toBe(2);
    expect(res.body.query.active).toBe(true);
  });

  it("rejects an out-of-range numeric param", async () => {
    const res = await request(queryApp()).get("/x?page=0");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  it("accepts an empty query", async () => {
    const res = await request(queryApp()).get("/x");
    expect(res.status).toBe(200);
  });
});
