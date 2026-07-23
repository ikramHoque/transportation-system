import http from "node:http";
import { env } from "./config/env";
import { createApp } from "./app";
import { runMigrations } from "./db/migrate";
import { createSocketServer } from "./realtime/socket";

async function main(): Promise<void> {
  await runMigrations();

  const app = createApp();
  const httpServer = http.createServer(app);
  createSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`BTS backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
