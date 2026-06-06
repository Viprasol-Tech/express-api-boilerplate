import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "../src/services/userService.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../src/errors.js";

describe("UserService", () => {
  let users: UserService;

  beforeEach(() => {
    users = new UserService();
  });

  it("registers a user and lowercases the email", () => {
    const u = users.register({ email: "Foo@Bar.COM", password: "longenough" });
    expect(u.email).toBe("foo@bar.com");
    expect(u.role).toBe("user");
    expect((u as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it("rejects duplicate emails", () => {
    users.register({ email: "x@y.com", password: "longenough" });
    expect(() => users.register({ email: "x@y.com", password: "another" })).toThrow(
      ConflictError,
    );
  });

  it("authenticates with correct credentials", () => {
    users.register({ email: "a@b.com", password: "correct-horse" });
    const u = users.authenticate({ email: "a@b.com", password: "correct-horse" });
    expect(u.email).toBe("a@b.com");
  });

  it("rejects a wrong password", () => {
    users.register({ email: "a@b.com", password: "correct-horse" });
    expect(() =>
      users.authenticate({ email: "a@b.com", password: "wrong" }),
    ).toThrow(UnauthorizedError);
  });

  it("rejects an unknown email without leaking existence", () => {
    expect(() =>
      users.authenticate({ email: "ghost@b.com", password: "whatever" }),
    ).toThrow(UnauthorizedError);
  });

  it("throws NotFoundError for an unknown id", () => {
    expect(() => users.get("nope")).toThrow(NotFoundError);
  });

  it("supports admin role and counts users", () => {
    users.register({ email: "admin@b.com", password: "longenough", role: "admin" });
    users.register({ email: "user@b.com", password: "longenough" });
    expect(users.count()).toBe(2);
    expect(users.list().some((u) => u.role === "admin")).toBe(true);
  });
});
