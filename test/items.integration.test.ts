import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { ItemService } from "../src/services/itemService.js";
import { buildTestApp } from "./helpers.js";

describe("items list: pagination & filtering over HTTP", () => {
  let app: Express;
  let service: ItemService;

  beforeEach(async () => {
    service = new ItemService();
    for (let i = 1; i <= 30; i++) {
      service.create({
        name: `Item ${i}`,
        quantity: i,
        category: i % 2 === 0 ? "even" : "odd",
      });
    }
    app = buildTestApp({ itemService: service });
  });

  it("paginates results with meta", async () => {
    const res = await request(app).get("/items?page=2&pageSize=10");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 30,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("clamps pageSize to the configured max", async () => {
    const res = await request(app).get("/items?pageSize=10000");
    expect(res.body.meta.pageSize).toBe(100);
  });

  it("filters by category", async () => {
    const res = await request(app).get("/items?category=even&pageSize=100");
    expect(res.body.meta.total).toBe(15);
    expect(res.body.data.every((i: { category: string }) => i.category === "even")).toBe(true);
  });

  it("filters by minQuantity", async () => {
    const res = await request(app).get("/items?minQuantity=25&pageSize=100");
    expect(res.body.meta.total).toBe(6);
  });

  it("sorts by quantity descending", async () => {
    const res = await request(app).get("/items?sortBy=quantity&order=desc&pageSize=3");
    expect(res.body.data.map((i: { quantity: number }) => i.quantity)).toEqual([
      30, 29, 28,
    ]);
  });

  it("rejects an invalid sortBy value with 400", async () => {
    const res = await request(app).get("/items?sortBy=bogus");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  it("rejects a zero page with 400", async () => {
    const res = await request(app).get("/items?page=0");
    expect(res.status).toBe(400);
  });

  it("enforces the rate limiter when enabled", async () => {
    const { createApp } = await import("../src/app.js");
    const { testConfig } = await import("./helpers.js");
    const limited = createApp({
      itemService: service,
      config: testConfig({ rateLimitMax: 3, rateLimitWindowMs: 60_000 }),
      disableRateLimit: false,
    });

    const first = await request(limited).get("/items");
    expect(first.status).toBe(200);
    await request(limited).get("/items");
    await request(limited).get("/items");
    const blocked = await request(limited).get("/items");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("TooManyRequestsError");
  });
});
