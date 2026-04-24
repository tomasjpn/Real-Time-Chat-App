import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { FastifyBaseLogger } from 'fastify';
import { initializeSocketControllers } from '../controllers/socket-controller.js';

export interface SocketIODependencies {
  httpServer: HTTPServer;
  logger: FastifyBaseLogger;
  corsOrigins: string[];
}

export function createSocketIOServer(
  deps: SocketIODependencies
): SocketIOServer {
  const { httpServer, logger, corsOrigins } = deps;

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  logger.info('Socket.IO server initialized with CORS configuration.');

  return io;
}

export function initializeSocketIO(
  server: import('fastify').FastifyInstance,
  io: SocketIOServer
): void {
  // Attach io to server for backward compatibility
  server.io = io;

  // Initialize socket controllers
  initializeSocketControllers(server);
}
