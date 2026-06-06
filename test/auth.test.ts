import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { signJwt } from "../src/auth/jwt.js";
import { buildTestApp, TEST_SECRET } from "./helpers.js";

describe("auth routes", () => {
  let app: Express;

  beforeEach(() => {
    app = buildTestApp();
  });

  it("registers a user and never returns the password hash", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "Jane@Example.com", password: "supersecret" });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("jane@example.com");
    expect(res.body.data.role).toBe("user");
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("rejects registration with a short password", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@b.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  it("rejects registration with an invalid email", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "longenough" });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate email registration with 409", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "dup@example.com", password: "longenough" });
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "dup@example.com", password: "longenough" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("ConflictError");
  });

  it("logs in and issues a Bearer token", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "login@example.com", password: "longenough" });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@example.com", password: "longenough" });
    expect(res.status).toBe(200);
    expect(res.body.data.tokenType).toBe("Bearer");
    expect(typeof res.body.data.token).toBe("string");
  });

  it("rejects login with wrong password (401)", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "wp@example.com", password: "longenough" });
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wp@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rejects login for unknown email (401)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ghost@example.com", password: "longenough" });
    expect(res.status).toBe(401);
  });

  it("returns the current user from /auth/me with a valid token", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "me@example.com", password: "longenough" });
    const login = await request(app)
      .post("/auth/login")
      .send({ email: "me@example.com", password: "longenough" });
    const token: string = login.body.data.token;

    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("me@example.com");
  });

  it("rejects /auth/me with a missing token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Missing Authorization/);
  });

  it("rejects /auth/me with a malformed scheme", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Token abc");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Bearer/);
  });

  it("rejects /auth/me with an expired token", async () => {
    const expired = signJwt({ sub: "x" }, TEST_SECRET, {
      expiresInSeconds: 1,
      now: 1000,
    });
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});
