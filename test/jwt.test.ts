import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, JwtError } from "../src/auth/jwt.js";

const SECRET = "unit-test-secret";

describe("jwt", () => {
  it("signs and verifies a token round-trip", () => {
    const token = signJwt({ sub: "user-1", role: "admin" }, SECRET, {
      expiresInSeconds: 60,
      now: 1000,
    });
    const claims = verifyJwt(token, SECRET, 1010);
    expect(claims.sub).toBe("user-1");
    expect(claims.role).toBe("admin");
    expect(claims.iat).toBe(1000);
    expect(claims.exp).toBe(1060);
  });

  it("rejects a tampered payload", () => {
    const token = signJwt({ sub: "user-1" }, SECRET, { expiresInSeconds: 60 });
    const [h, , s] = token.split(".");
    const forged = `${h}.${Buffer.from('{"sub":"hacker","exp":9999999999}').toString("base64url")}.${s}`;
    expect(() => verifyJwt(forged, SECRET)).toThrow(JwtError);
  });

  it("rejects a token signed with a different secret", () => {
    const token = signJwt({ sub: "u" }, SECRET, { expiresInSeconds: 60 });
    expect(() => verifyJwt(token, "wrong-secret")).toThrow(/Invalid signature/);
  });

  it("rejects an expired token", () => {
    const token = signJwt({ sub: "u" }, SECRET, {
      expiresInSeconds: 10,
      now: 1000,
    });
    expect(() => verifyJwt(token, SECRET, 2000)).toThrow(/expired/);
  });

  it("rejects a malformed token", () => {
    expect(() => verifyJwt("not.a.valid.jwt", SECRET)).toThrow(JwtError);
    expect(() => verifyJwt("only-one-segment", SECRET)).toThrow(/3 segments/);
  });

  it("rejects an unsupported algorithm", () => {
    const header = Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url");
    const payload = Buffer.from('{"sub":"u","exp":9999999999}').toString("base64url");
    expect(() => verifyJwt(`${header}.${payload}.sig`, SECRET)).toThrow(
      /Unsupported algorithm/,
    );
  });
});
