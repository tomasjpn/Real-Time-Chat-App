import { createSocketIOServer, initializeSocketIO } from './socket-server.js';
import { FastifyInstance } from 'fastify';

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
        corsOrigins: ['http://localhost:5173', 'http://localhost:4173'],
      });

      initializeSocketIO(server, io);
      resolve();
    });
  });
}

export { webSocketSetup };
