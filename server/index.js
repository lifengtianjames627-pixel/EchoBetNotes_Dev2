import { buildApp } from './app.js';
import { config } from './config/env.js';
import { migrate } from './db/migrate.js';
import { closePool } from './db/pool.js';

await migrate();
const app = await buildApp();

const shutdown = async (signal) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  await closePool();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await closePool();
  process.exit(1);
}
