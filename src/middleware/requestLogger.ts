import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/** A single structured log record emitted per request. */
export interface RequestLog {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

export interface RequestLoggerOptions {
  /** Sink for log records (defaults to JSON-on-stdout). */
  sink?: (entry: RequestLog) => void;
  /** Clock override (ms since epoch) — useful for deterministic tests. */
  now?: () => number;
  /** Header to read/propagate a correlation id (default `x-request-id`). */
  requestIdHeader?: string;
}

function defaultSink(entry: RequestLog): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

/**
 * Structured request logger. Assigns each request a correlation id (honoring an
 * inbound id header when present), echoes it back via `X-Request-Id`, and emits
 * one JSON log line per request once the response finishes.
 */
export function requestLogger(
  options: RequestLoggerOptions = {},
): RequestHandler {
  const sink = options.sink ?? defaultSink;
  const clock = options.now ?? (() => Date.now());
  const idHeader = (options.requestIdHeader ?? "x-request-id").toLowerCase();

  return (req, res, next) => {
    const inbound = req.header(idHeader);
    const requestId = inbound && inbound.length > 0 ? inbound : randomUUID();
    const start = clock();

    res.setHeader("X-Request-Id", requestId);
    (req as { requestId?: string }).requestId = requestId;

    res.on("finish", () => {
      sink({
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: clock() - start,
        timestamp: new Date(clock()).toISOString(),
      });
    });

    next();
  };
}
