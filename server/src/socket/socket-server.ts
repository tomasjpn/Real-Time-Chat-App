import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { initializeSocketControllers } from '../controllers/socket-controller.js';
import { TypedSocketServer } from '../types/server.js';

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

  initializeSocketControllers(server);
}
