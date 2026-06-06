<div align="center">
  <img src="docs/assets/logo.png" alt="Viprasol Tech" width="160" />

  <h1>express-api-boilerplate</h1>

  <p><strong>Production-style Express + TypeScript REST API boilerplate.</strong></p>

  <p>Built and maintained by Viprasol Tech</p>

  <p>
    <a href="https://github.com/Viprasol-Tech/express-api-boilerplate/actions"><img src="https://github.com/Viprasol-Tech/express-api-boilerplate/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
    <img src="https://img.shields.io/badge/TypeScript-strict-3178c6.svg" alt="TypeScript strict" />
  </p>
</div>

A clean, dependency-light starting point for building REST APIs with Express and
TypeScript. Ships with a `createApp()` factory (no `app.listen` baked in, so it
is trivially testable), centralized async error handling, a 404 handler, a
schema-based body validator, and an in-memory CRUD resource backed by a service
layer you can swap for a real database.

## Features

- **`createApp()` factory** — returns a configured Express app; bind the port yourself in `server.ts`.
- **Async error pipeline** — `asyncHandler` forwards rejected promises to a central error handler.
- **Typed HTTP errors** — `HttpError` / `NotFoundError` / `ValidationError` map cleanly to status codes.
- **404 handler** — unmatched routes return a structured JSON error.
- **Body validation** — dependency-free `validateBody(schema)` middleware (string/number/boolean, required, min).
- **CRUD resource** — `GET/POST /items`, `GET/DELETE /items/:id` with a swappable `ItemService`.
- **Health probe** — `GET /health` for readiness/liveness checks.
- **Strict TypeScript** + **vitest + supertest** in-process tests (no real port needed).

## Install

```bash
npm install
```

## Usage

```ts
import { createApp } from "express-api-boilerplate";

const app = createApp();

app.listen(3000, () => {
  console.log("API listening on http://localhost:3000");
});
```

Run the bundled server entry point directly:

```bash
npm run build
node dist/server.js   # PORT env var optional, defaults to 3000
```

### Endpoints

| Method | Path          | Description                       |
| ------ | ------------- | --------------------------------- |
| GET    | `/health`     | Health probe (`200`)              |
| GET    | `/items`      | List all items                    |
| POST   | `/items`      | Create an item (validated body)   |
| GET    | `/items/:id`  | Fetch one item (`404` if missing) |
| DELETE | `/items/:id`  | Delete an item (`204`)            |

```bash
# create
curl -X POST localhost:3000/items \
  -H 'content-type: application/json' \
  -d '{"name":"Widget","quantity":5}'

# bad body -> 400 ValidationError
curl -X POST localhost:3000/items \
  -H 'content-type: application/json' \
  -d '{"name":"Widget"}'
```

## API notes

- `createApp(options?)` accepts `{ itemService }` so you can inject a custom or
  mocked `ItemService` in tests.
- `validateBody(schema)` throws a `ValidationError` (HTTP 400) whose `details`
  field is an array of human-readable messages.
- The service layer (`ItemService`) isolates persistence — replace the in-memory
  `Map` with a database client without touching the HTTP routes.

## Scripts

```bash
npm run build       # tsc -> dist/
npm run typecheck   # tsc --noEmit
npm test            # vitest run
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md) before opening a pull request.

## Contact — Viprasol Tech Private Limited

- Website: [viprasol.com](https://viprasol.com)
- Email: [support@viprasol.com](mailto:support@viprasol.com)
- Telegram: [t.me/viprasol_help](https://t.me/viprasol_help) | WhatsApp: +91 96336 52112
- GitHub: [@Viprasol-Tech](https://github.com/Viprasol-Tech) | [LinkedIn](https://www.linkedin.com/in/viprasol/) | X [@viprasol](https://twitter.com/viprasol)

## License

[MIT](LICENSE) (c) 2025 Viprasol Tech Private Limited
