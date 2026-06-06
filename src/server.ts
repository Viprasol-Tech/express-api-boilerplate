import { createApp } from "./app.js";

/**
 * Entry point for running the API as a standalone server.
 * `createApp` stays listen-free so it can be tested; this thin wrapper binds
 * the port for real deployments (`node dist/server.js`).
 */
const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`express-api-boilerplate listening on http://localhost:${port}`);
});
