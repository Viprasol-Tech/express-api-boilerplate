import { Router } from "express";

/** Health/readiness probe router. */
export function healthRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
