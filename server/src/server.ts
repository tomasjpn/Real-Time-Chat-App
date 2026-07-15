import Fastify from 'fastify';
import { initializeDatabase } from '../db/config/db.js';
import { CONFIG } from '../db/config/config.js';
import { registerPlugins } from './plugins/index.js';
import { initializeRoutes } from './routes/index.js';
import { webSocketSetup } from './socket/index.js';

const server = Fastify({
  logger: true,
});

async function startServer() {
  try {
    const dbReady = await initializeDatabase(server);
    if (!dbReady) {
      throw new Error('Database initialization failed');
    }

    await registerPlugins(server);

    await initializeRoutes(server);

    await webSocketSetup(server);

    await server.listen({ port: CONFIG.app.port, host: CONFIG.app.host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
