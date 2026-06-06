import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors.js";
import { JwtError, verifyJwt, type JwtClaims } from "./jwt.js";

/** The authenticated principal attached to a request after `authenticate`. */
export interface AuthUser {
  id: string;
  role: string;
  claims: JwtClaims;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware on success. */
      user?: AuthUser;
    }
  }
}

export interface AuthenticateOptions {
  /** Secret used to verify the token signature. */
  secret: string;
  /** Clock override (seconds since epoch) — useful for deterministic tests. */
  now?: () => number;
}

function extractBearer(header: string | undefined): string {
  if (!header) throw new UnauthorizedError("Missing Authorization header");
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Authorization header must be 'Bearer <token>'");
  }
  return token;
}

/**
 * Verifies a `Bearer` JWT and attaches the decoded user to `req.user`.
 * Throws {@link UnauthorizedError} (401) when the token is missing or invalid.
 */
export function authenticate(options: AuthenticateOptions): RequestHandler {
  return (req, _res, next) => {
    try {
      const token = extractBearer(req.header("authorization") ?? undefined);
      const claims = verifyJwt(
        token,
        options.secret,
        options.now ? options.now() : undefined,
      );
      const role = typeof claims.role === "string" ? claims.role : "user";
      req.user = { id: claims.sub, role, claims };
      next();
    } catch (err) {
      if (err instanceof JwtError) {
        next(new UnauthorizedError(err.message));
        return;
      }
      next(err);
    }
  };
}

/**
 * Guards a route so only users holding one of `roles` may proceed. Must run
 * after {@link authenticate}. Throws {@link ForbiddenError} (403) otherwise.
 */
export function requireRole(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Requires one of role(s): ${roles.join(", ")}`,
        ),
      );
      return;
    }
    next();
  };
}
