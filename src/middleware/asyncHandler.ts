import type { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's error pipeline instead of producing an unhandled rejection.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
