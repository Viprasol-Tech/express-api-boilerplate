import type { RequestHandler } from "express";
import { ValidationError } from "../errors.js";

export type FieldType = "string" | "number" | "boolean";

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  /** Minimum value for numbers, or minimum length for strings. */
  min?: number;
}

export type BodySchema = Record<string, FieldRule>;

/**
 * Lightweight body validator. Validates the request body against a simple
 * field schema and throws a {@link ValidationError} (HTTP 400) on the first
 * batch of problems. Keeps the boilerplate dependency-free.
 */
export function validateBody(schema: BodySchema): RequestHandler {
  return (req, _res, next) => {
    const body = req.body as Record<string, unknown> | undefined;
    const errors: string[] = [];

    if (body === undefined || body === null || typeof body !== "object") {
      next(new ValidationError("Request body must be a JSON object"));
      return;
    }

    for (const [field, rule] of Object.entries(schema)) {
      const value = body[field];
      const present = value !== undefined && value !== null;

      if (!present) {
        if (rule.required) errors.push(`'${field}' is required`);
        continue;
      }

      if (rule.type === "number") {
        if (typeof value !== "number" || Number.isNaN(value)) {
          errors.push(`'${field}' must be a number`);
        } else if (rule.min !== undefined && value < rule.min) {
          errors.push(`'${field}' must be >= ${rule.min}`);
        }
      } else if (rule.type === "string") {
        if (typeof value !== "string") {
          errors.push(`'${field}' must be a string`);
        } else if (rule.min !== undefined && value.length < rule.min) {
          errors.push(`'${field}' must have length >= ${rule.min}`);
        }
      } else if (rule.type === "boolean") {
        if (typeof value !== "boolean") {
          errors.push(`'${field}' must be a boolean`);
        }
      }
    }

    if (errors.length > 0) {
      next(new ValidationError("Validation failed", errors));
      return;
    }

    next();
  };
}
