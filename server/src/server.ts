import Fastify from 'fastify';
import { initializeDatabase } from '../db/config/db.js';
import { registerPlugins } from './plugins/index.js';
import { initializeRoutes } from './routes/index.js';
import { initializeSocketControllers } from './controllers/index.js';

const server = Fastify({
  logger: true,
});

async function startServer() {
  try {
    await initializeDatabase(server);

    await registerPlugins(server);

    await initializeRoutes(server);

    initializeSocketControllers(server);

    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

startServer();
