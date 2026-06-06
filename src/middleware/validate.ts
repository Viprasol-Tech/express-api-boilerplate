import type { Request, RequestHandler } from "express";
import { ValidationError } from "../errors.js";

export type FieldType = "string" | "number" | "boolean";

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  /** Minimum value for numbers, or minimum length for strings. */
  min?: number;
  /** Maximum value for numbers, or maximum length for strings. */
  max?: number;
  /** Restrict a string/number to a fixed set of allowed values. */
  enum?: ReadonlyArray<string | number>;
  /** Regex a string value must match. */
  pattern?: RegExp;
}

export type BodySchema = Record<string, FieldRule>;
export type QuerySchema = Record<string, FieldRule>;

function checkField(
  field: string,
  rule: FieldRule,
  value: unknown,
  coerce: boolean,
): { errors: string[]; coerced?: unknown } {
  const errors: string[] = [];
  const present = value !== undefined && value !== null && value !== "";

  if (!present) {
    if (rule.required) errors.push(`'${field}' is required`);
    return { errors };
  }

  if (rule.type === "number") {
    const num = coerce ? Number(value) : value;
    if (typeof num !== "number" || Number.isNaN(num)) {
      errors.push(`'${field}' must be a number`);
      return { errors };
    }
    if (rule.min !== undefined && num < rule.min) {
      errors.push(`'${field}' must be >= ${rule.min}`);
    }
    if (rule.max !== undefined && num > rule.max) {
      errors.push(`'${field}' must be <= ${rule.max}`);
    }
    if (rule.enum && !rule.enum.includes(num)) {
      errors.push(`'${field}' must be one of: ${rule.enum.join(", ")}`);
    }
    return { errors, coerced: num };
  }

  if (rule.type === "string") {
    if (typeof value !== "string") {
      errors.push(`'${field}' must be a string`);
      return { errors };
    }
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`'${field}' must have length >= ${rule.min}`);
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`'${field}' must have length <= ${rule.max}`);
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`'${field}' must be one of: ${rule.enum.join(", ")}`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`'${field}' has an invalid format`);
    }
    return { errors, coerced: value };
  }

  // boolean
  let bool: unknown = value;
  if (coerce && (value === "true" || value === "false")) {
    bool = value === "true";
  }
  if (typeof bool !== "boolean") {
    errors.push(`'${field}' must be a boolean`);
    return { errors };
  }
  return { errors, coerced: bool };
}

/**
 * Lightweight body validator. Validates the request body against a simple field
 * schema and throws a {@link ValidationError} (HTTP 400) with all problems.
 * Keeps the boilerplate dependency-free.
 */
export function validateBody(schema: BodySchema): RequestHandler {
  return (req, _res, next) => {
    const body = req.body as Record<string, unknown> | undefined;

    if (body === undefined || body === null || typeof body !== "object") {
      next(new ValidationError("Request body must be a JSON object"));
      return;
    }

    const errors: string[] = [];
    for (const [field, rule] of Object.entries(schema)) {
      errors.push(...checkField(field, rule, body[field], false).errors);
    }

    if (errors.length > 0) {
      next(new ValidationError("Validation failed", errors));
      return;
    }
    next();
  };
}

/**
 * Validates (and coerces) the query string against a schema. Query values are
 * always strings on the wire, so numbers/booleans are coerced in place on
 * `req.query` so downstream handlers receive typed values.
 */
export function validateQuery(schema: QuerySchema): RequestHandler {
  return (req: Request, _res, next) => {
    const query = req.query as Record<string, unknown>;
    const errors: string[] = [];
    const coercions: Record<string, unknown> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const result = checkField(field, rule, query[field], true);
      errors.push(...result.errors);
      if (result.coerced !== undefined) {
        coercions[field] = result.coerced;
      }
    }

    if (errors.length > 0) {
      next(new ValidationError("Query validation failed", errors));
      return;
    }

    for (const [field, value] of Object.entries(coercions)) {
      (query as Record<string, unknown>)[field] = value;
    }
    next();
  };
}
