import type { Request, RequestHandler } from "express";
import { TooManyRequestsError } from "../errors.js";

export interface RateLimitOptions {
  /** Max requests allowed per window, per key. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Derive the bucket key from a request (defaults to client IP). */
  keyGenerator?: (req: Request) => string;
  /** Clock override (ms since epoch) — useful for deterministic tests. */
  now?: () => number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

function defaultKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

/**
 * Fixed-window, in-memory rate limiter. Dependency-free and good enough for a
 * single-process boilerplate; swap the `Map` for Redis to scale horizontally.
 *
 * Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`
 * headers, and a `Retry-After` header on 429 responses.
 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const keyOf = options.keyGenerator ?? defaultKey;
  const clock = options.now ?? (() => Date.now());

  return (req, res, next) => {
    const now = clock();
    const key = keyOf(req);
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, options.max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader("X-RateLimit-Limit", options.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (bucket.count > options.max) {
      res.setHeader("Retry-After", resetSeconds);
      next(
        new TooManyRequestsError("Rate limit exceeded", {
          limit: options.max,
          retryAfterSeconds: resetSeconds,
        }),
      );
      return;
    }

    next();
  };
}
