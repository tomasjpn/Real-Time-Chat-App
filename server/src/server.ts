import Fastify, { FastifyError } from 'fastify';
import { initializeDatabase } from '../db/config/db.js';
import { CONFIG } from '../db/config/config.js';
import { registerPlugins } from './plugins/index.js';
import { initializeRoutes } from './routes/index.js';
import { webSocketSetup } from './socket/index.js';

const server = Fastify({
  logger: true,
});

// Never leak internals (SQL, stack traces, hashes) in 5xx responses;
// the full error still goes to the log.
server.setErrorHandler((error: FastifyError, request, reply) => {
  const statusCode = error.statusCode ?? 500;
  server.log.error({ err: error, url: request.url }, 'Request failed');

  if (statusCode >= 500) {
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
  return reply.code(statusCode).send({ error: error.message });
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
