import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { initializeSocketControllers } from '../controllers/socket-controller.js';
import { AccessTokenPayload, TypedSocketServer } from '../types/server.js';

export interface SocketIODependencies {
  httpServer: HTTPServer;
  logger: FastifyBaseLogger;
  corsOrigins: string[];
}

export function createSocketIOServer(
  deps: SocketIODependencies
): TypedSocketServer {
  const { httpServer, logger, corsOrigins } = deps;

  const io: TypedSocketServer = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  logger.info('Socket.IO server initialized with CORS configuration.');

  return io;
}

export function initializeSocketIO(
  server: FastifyInstance,
  io: TypedSocketServer
): void {
  server.io = io;

  // Handshake auth: no valid access token, no connection. Every handler
  // after this point trusts socket.data, never client-supplied identity.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
      return next(new Error('unauthorized'));
    }

    try {
      const payload = server.jwt.verify<AccessTokenPayload>(token);
      socket.data.userId = payload.sub;

      socket.data.username = payload.username;
      socket.data.displayName = payload.displayName;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  initializeSocketControllers(server);
}
