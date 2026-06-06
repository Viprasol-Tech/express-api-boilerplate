# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/); versioning
follows [SemVer](https://semver.org/).

## [0.2.0] - 2025

### Added
- **JWT authentication** — dependency-free HS256 sign/verify built on `node:crypto`
  (`signJwt`/`verifyJwt`), an `authenticate` middleware that populates `req.user`,
  and a `requireRole(...)` guard for role-based access control.
- **Auth routes** — `POST /auth/register`, `POST /auth/login` (issues a Bearer
  token), and protected `GET /auth/me`, backed by a new `UserService` with salted
  scrypt password hashing (hashes never leave the service).
- **Request validation upgrades** — `validateBody` now supports `max`, `enum`, and
  `pattern` rules; new `validateQuery` middleware validates and coerces query-string
  params.
- **Pagination & filtering** — `parsePagination`/`paginate` helpers and a richer
  `GET /items` supporting `page`, `pageSize` (clamped to a max), `search`,
  `category`, `minQuantity`, `sortBy`, and `order`.
- **Rate limiting** — fixed-window in-memory `rateLimit` middleware emitting
  `X-RateLimit-*` and `Retry-After` headers (429 on exceed).
- **Structured request logging** — `requestLogger` assigns/propagates a correlation
  id (`X-Request-Id`) and emits one JSON log line per request.
- **Centralized config** — typed `loadConfig`/`config` reading and validating env
  vars in one place.
- **OpenAPI docs** — `GET /openapi.json` (OpenAPI 3.0) plus a self-describing route
  index at `GET /`.
- **More resources & verbs** — `PATCH /items/:id` (partial update), admin-only
  `DELETE /items/:id`, and `category` support on items.
- **New error types** — `UnauthorizedError` (401), `ForbiddenError` (403),
  `ConflictError` (409), `TooManyRequestsError` (429).
- Test suite expanded from 13 to 85 tests across unit and supertest integration
  coverage.

### Changed
- `createApp` now accepts `config`, `userService`, `disableRateLimit`, and
  `logSink` options and wires in logging, rate limiting, auth, and docs.
- Mutating item routes are now authenticated; deletes require the `admin` role.

## [0.1.0] - 2025

### Added
- Initial release of express-api-boilerplate: Production-style Express + TypeScript REST API boilerplate.
