/**
 * Application-level HTTP error. Carries a status code so the central error
 * handler can translate thrown errors into proper HTTP responses.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
    // Restore the *actual* subclass prototype (transpilation to ES5-style
    // targets can break the chain), keeping `instanceof` reliable for
    // NotFoundError/ValidationError as well as HttpError.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found", details?: unknown) {
    super(404, message, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation failed", details?: unknown) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}
