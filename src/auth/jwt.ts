import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal, dependency-free JWT (HS256) implementation built on `node:crypto`.
 *
 * This intentionally avoids pulling in `jsonwebtoken` so the boilerplate stays
 * lean. It supports the subset most APIs need: signing a payload, verifying the
 * signature, and enforcing `exp` (expiry) and `iat` (issued-at) claims.
 */

export interface JwtClaims {
  /** Subject — typically the user id. */
  sub: string;
  /** Issued-at (seconds since epoch). */
  iat: number;
  /** Expiry (seconds since epoch). */
  exp: number;
  /** Arbitrary additional claims (e.g. role). */
  [key: string]: unknown;
}

export interface SignOptions {
  /** Lifetime in seconds; the `exp` claim is derived from this. */
  expiresInSeconds: number;
  /** Override the issued-at time (seconds since epoch); defaults to now. */
  now?: number;
}

const HEADER = { alg: "HS256", typ: "JWT" } as const;

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(data).digest());
}

/** Error thrown when a token fails verification. */
export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtError";
  }
}

/**
 * Signs a JWT. Any extra fields on `payload` become custom claims; `iat`/`exp`
 * are managed for you.
 */
export function signJwt(
  payload: Record<string, unknown> & { sub: string },
  secret: string,
  options: SignOptions,
): string {
  const iat = options.now ?? Math.floor(Date.now() / 1000);
  const exp = iat + options.expiresInSeconds;
  const fullClaims: JwtClaims = { ...payload, sub: payload.sub, iat, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(HEADER));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullClaims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput, secret);
  return `${signingInput}.${signature}`;
}

/**
 * Verifies a JWT and returns its claims. Throws {@link JwtError} on a malformed
 * token, bad signature, wrong algorithm, or expired token.
 */
export function verifyJwt(
  token: string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): JwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JwtError("Malformed token: expected 3 segments");
  }
  const [encodedHeader, encodedPayload, providedSignature] = parts;

  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
  } catch {
    throw new JwtError("Malformed token header");
  }
  if (header.alg !== "HS256") {
    throw new JwtError(`Unsupported algorithm: ${String(header.alg)}`);
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);
  const a = Buffer.from(providedSignature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new JwtError("Invalid signature");
  }

  let claims: JwtClaims;
  try {
    claims = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    throw new JwtError("Malformed token payload");
  }

  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new JwtError("Token expired");
  }

  return claims;
}
