export { createApp, type AppOptions } from "./app.js";
export { config, loadConfig, type AppConfig } from "./config.js";

export { ItemService } from "./services/itemService.js";
export { UserService } from "./services/userService.js";

export { asyncHandler } from "./middleware/asyncHandler.js";
export {
  validateBody,
  validateQuery,
  type BodySchema,
  type QuerySchema,
  type FieldRule,
  type FieldType,
} from "./middleware/validate.js";
export { rateLimit, type RateLimitOptions } from "./middleware/rateLimit.js";
export {
  requestLogger,
  type RequestLog,
  type RequestLoggerOptions,
} from "./middleware/requestLogger.js";
export {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";

export {
  authenticate,
  requireRole,
  type AuthUser,
  type AuthenticateOptions,
} from "./auth/authMiddleware.js";
export {
  signJwt,
  verifyJwt,
  JwtError,
  type JwtClaims,
  type SignOptions,
} from "./auth/jwt.js";

export {
  parsePagination,
  paginate,
  type PaginationParams,
  type PaginationMeta,
  type Paginated,
} from "./pagination.js";

export { buildOpenApiDocument, type OpenApiInfo } from "./openapi.js";

export {
  HttpError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
} from "./errors.js";

export type {
  Item,
  CreateItemInput,
  UpdateItemInput,
  ListItemsQuery,
  User,
  PublicUser,
  RegisterUserInput,
  LoginInput,
} from "./types.js";
