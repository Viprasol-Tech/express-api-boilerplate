import { Router } from "express";
import { buildOpenApiDocument, type OpenApiInfo } from "../openapi.js";

/**
 * Serves the OpenAPI document at `GET /openapi.json` and a tiny machine-readable
 * route index at `GET /` so the API is self-documenting out of the box.
 */
export function docsRouter(info: OpenApiInfo): Router {
  const router = Router();
  const document = buildOpenApiDocument(info);

  router.get("/openapi.json", (_req, res) => {
    res.status(200).json(document);
  });

  router.get("/", (_req, res) => {
    res.status(200).json({
      name: info.title,
      version: info.version,
      docs: "/openapi.json",
      endpoints: [
        "GET /health",
        "POST /auth/register",
        "POST /auth/login",
        "GET /auth/me",
        "GET /items",
        "POST /items",
        "GET /items/:id",
        "PATCH /items/:id",
        "DELETE /items/:id",
      ],
    });
  });

  return router;
}
