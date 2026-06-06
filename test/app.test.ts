import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { buildTestApp, registerAndLogin } from "./helpers.js";

describe("express-api-boilerplate", () => {
  let app: Express;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    app = buildTestApp();
    userToken = await registerAndLogin(app, "user@example.com", "password123");
    adminToken = await registerAndLogin(
      app,
      "admin@example.com",
      "password123",
      "admin",
    );
  });

  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("GET / returns a route index", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.docs).toBe("/openapi.json");
    expect(Array.isArray(res.body.endpoints)).toBe(true);
  });

  it("creates an item (authenticated) and fetches it back by id", async () => {
    const create = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Widget", quantity: 5 });

    expect(create.status).toBe(201);
    expect(create.body.data).toMatchObject({ name: "Widget", quantity: 5 });
    expect(create.body.data.category).toBe("uncategorized");
    const id: string = create.body.data.id;
    expect(typeof id).toBe("string");

    const fetched = await request(app).get(`/items/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(id);
    expect(fetched.body.data.name).toBe("Widget");
  });

  it("rejects unauthenticated item creation with 401", async () => {
    const res = await request(app)
      .post("/items")
      .send({ name: "Widget", quantity: 5 });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UnauthorizedError");
  });

  it("lists created items with pagination meta", async () => {
    await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "A", quantity: 1 });
    await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "B", quantity: 2 });

    const res = await request(app).get("/items");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.meta.page).toBe(1);
  });

  it("patches an item (authenticated)", async () => {
    const create = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Old", quantity: 1 });
    const id: string = create.body.data.id;

    const patch = await request(app)
      .patch(`/items/${id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "New", quantity: 9 });
    expect(patch.status).toBe(200);
    expect(patch.body.data.name).toBe("New");
    expect(patch.body.data.quantity).toBe(9);
  });

  it("only admins can delete, then 404 on subsequent fetch", async () => {
    const create = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Temp", quantity: 1 });
    const id: string = create.body.data.id;

    const forbidden = await request(app)
      .delete(`/items/${id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error).toBe("ForbiddenError");

    const del = await request(app)
      .delete(`/items/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
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
    const res = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "NoQty" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details).toContain("'quantity' is required");
  });

  it("returns 400 when field types are wrong", async () => {
    const res = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: 123, quantity: "lots" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it("returns 400 when quantity is negative", async () => {
    const res = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Neg", quantity: -3 });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain("'quantity' must be >= 0");
  });

  it("echoes an X-Request-Id header", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("serves the OpenAPI document", async () => {
    const res = await request(app).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths["/items"]).toBeTruthy();
  });
});
