import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError, NotFoundError } from "../errors.js";

/** Terminal 404 handler for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.path}`));
};

/**
 * Central error handler. Translates {@link HttpError} instances into their
 * declared status codes and falls back to 500 for anything unexpected.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: "InternalServerError", message });
};
