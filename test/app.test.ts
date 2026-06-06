import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";

describe("express-api-boilerplate", () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("creates an item and fetches it back by id", async () => {
    const create = await request(app)
      .post("/items")
      .send({ name: "Widget", quantity: 5 });

    expect(create.status).toBe(201);
    expect(create.body.data).toMatchObject({ name: "Widget", quantity: 5 });
    const id: string = create.body.data.id;
    expect(typeof id).toBe("string");

    const fetched = await request(app).get(`/items/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);
    expect(fetched.body.data.name).toBe("Widget");
  });

  it("lists created items", async () => {
    await request(app).post("/items").send({ name: "A", quantity: 1 });
    await request(app).post("/items").send({ name: "B", quantity: 2 });

    const res = await request(app).get("/items");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("deletes an item, then 404 on subsequent fetch", async () => {
    const create = await request(app)
      .post("/items")
      .send({ name: "Temp", quantity: 1 });
    const id: string = create.body.data.id;

    const del = await request(app).delete(`/items/${id}`);
    expect(del.status).toBe(204);

    const fetched = await request(app).get(`/items/${id}`);
    expect(fetched.status).toBe(404);
    expect(fetched.body.error).toBe("NotFoundError");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NotFoundError");
  });

  it("returns 404 when fetching a missing item id", async () => {
    const res = await request(app).get("/items/missing-id");
    expect(res.status).toBe(404);
  });

  it("returns 400 when body is missing required fields", async () => {
    const res = await request(app).post("/items").send({ name: "NoQty" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details).toContain("'quantity' is required");
  });

  it("returns 400 when field types are wrong", async () => {
    const res = await request(app)
      .post("/items")
      .send({ name: 123, quantity: "lots" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it("returns 400 when quantity is negative", async () => {
    const res = await request(app)
      .post("/items")
      .send({ name: "Neg", quantity: -3 });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain("'quantity' must be >= 0");
  });
});
