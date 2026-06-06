import { createApp } from "./app.js";
import { config } from "./config.js";

/**
 * Entry point for running the API as a standalone server.
 * `createApp` stays listen-free so it can be tested; this thin wrapper binds
 * the port for real deployments (`node dist/server.js`).
 */
const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `express-api-boilerplate listening on http://localhost:${config.port} [${config.env}]`,
  );
});
