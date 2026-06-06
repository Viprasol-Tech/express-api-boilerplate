import express, { type Express } from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";
import { ItemService } from "./services/itemService.js";

export interface AppOptions {
  /** Inject a custom item service (useful for tests). */
  itemService?: ItemService;
}

/**
 * Builds and wires up the Express application.
 *
 * Intentionally does NOT call `app.listen` — the factory returns a configured
 * app so it can be supertest-ed in-process and bound to a port by the caller.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const itemService = options.itemService ?? new ItemService();

  app.use(express.json());

  app.use(healthRouter());
  app.use(itemsRouter(itemService));

  // Order matters: 404 then central error handler last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
