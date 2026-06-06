/**
 * Hand-authored OpenAPI 3.0 document describing the API surface. Kept as a
 * plain object (no codegen dependency) and served at `GET /openapi.json` so
 * tooling like Swagger UI / Redoc can consume it.
 */
export interface OpenApiInfo {
  title: string;
  version: string;
}

export function buildOpenApiDocument(info: OpenApiInfo): Record<string, unknown> {
  return {
    openapi: "3.0.3",
    info: {
      title: info.title,
      version: info.version,
      description:
        "Production-style Express + TypeScript REST API boilerplate by Viprasol Tech.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Item: {
          type: "object",
          required: ["id", "name", "quantity", "category", "createdAt"],
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            quantity: { type: "integer", minimum: 0 },
            category: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          required: ["id", "email", "role", "createdAt"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["user", "admin"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          required: ["error", "message"],
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            details: {},
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Liveness/readiness probe",
          responses: { "200": { description: "Service is healthy" } },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register a new user",
          responses: {
            "201": { description: "Created" },
            "400": { description: "Validation failed" },
            "409": { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Authenticate and receive a JWT",
          responses: {
            "200": { description: "Token issued" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/auth/me": {
        get: {
          summary: "Current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/items": {
        get: {
          summary: "List items (paginated + filtered)",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "minQuantity", in: "query", schema: { type: "integer" } },
            { name: "sortBy", in: "query", schema: { type: "string", enum: ["name", "quantity", "createdAt"] } },
            { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: { "200": { description: "Paginated list" } },
        },
        post: {
          summary: "Create an item",
          security: [{ bearerAuth: [] }],
          responses: {
            "201": { description: "Created" },
            "400": { description: "Validation failed" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/items/{id}": {
        get: {
          summary: "Fetch one item",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Item" }, "404": { description: "Not found" } },
        },
        patch: {
          summary: "Update an item",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Updated" },
            "401": { description: "Unauthorized" },
            "404": { description: "Not found" },
          },
        },
        delete: {
          summary: "Delete an item (admin only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "204": { description: "Deleted" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Not found" },
          },
        },
      },
    },
  };
}
