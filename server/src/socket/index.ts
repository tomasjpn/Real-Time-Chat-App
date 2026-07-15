import { createSocketIOServer, initializeSocketIO } from './socket-server.js';
import { FastifyInstance } from 'fastify';
import { CONFIG } from '../../db/config/config.js';

async function webSocketSetup(server: FastifyInstance) {
  await new Promise<void>((resolve, reject) => {
    server.ready((err) => {
      if (err) {
        reject(err);
        return;
      }

      const io = createSocketIOServer({
        httpServer: server.server,
        logger: server.log,
        corsOrigins: CONFIG.corsOrigins,
      });

      initializeSocketIO(server, io);
      resolve();
    });
  });
}

export { webSocketSetup };
