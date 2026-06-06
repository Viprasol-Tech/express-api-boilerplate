import express, { type Express } from "express";
import { config as defaultConfig, type AppConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { requestLogger, type RequestLog } from "./middleware/requestLogger.js";
import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";
import { authRouter } from "./routes/auth.js";
import { docsRouter } from "./routes/docs.js";
import { ItemService } from "./services/itemService.js";
import { UserService } from "./services/userService.js";

export interface AppOptions {
  /** Inject a custom item service (useful for tests). */
  itemService?: ItemService;
  /** Inject a custom user service (useful for tests). */
  userService?: UserService;
  /** Override configuration (defaults to the env-derived singleton). */
  config?: AppConfig;
  /** Disable the rate limiter (handy for high-volume test suites). */
  disableRateLimit?: boolean;
  /** Custom log sink; pass a no-op to silence logs in tests. */
  logSink?: (entry: RequestLog) => void;
}

/**
 * Builds and wires up the Express application.
 *
 * Intentionally does NOT call `app.listen` — the factory returns a configured
 * app so it can be supertest-ed in-process and bound to a port by the caller.
 */
export function createApp(options: AppOptions = {}): Express {
  const cfg = options.config ?? defaultConfig;
  const itemService = options.itemService ?? new ItemService();
  const userService = options.userService ?? new UserService();

  const app = express();
  app.set("trust proxy", true);
  app.use(express.json());

  if (cfg.logRequests || options.logSink) {
    app.use(requestLogger({ sink: options.logSink }));
  }

  if (!options.disableRateLimit) {
    app.use(
      rateLimit({ max: cfg.rateLimitMax, windowMs: cfg.rateLimitWindowMs }),
    );
  }

  app.use(docsRouter({ title: "express-api-boilerplate", version: "0.2.0" }));
  app.use(healthRouter());
  app.use(
    authRouter({
      users: userService,
      jwtSecret: cfg.jwtSecret,
      jwtExpiresInSeconds: cfg.jwtExpiresInSeconds,
    }),
  );
  app.use(
    itemsRouter({
      service: itemService,
      jwtSecret: cfg.jwtSecret,
      defaultPageSize: cfg.defaultPageSize,
      maxPageSize: cfg.maxPageSize,
    }),
  );

  // Order matters: 404 then central error handler last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
