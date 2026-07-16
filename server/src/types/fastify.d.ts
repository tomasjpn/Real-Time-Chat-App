import 'fastify';
import type { TypedSocketServer } from './server.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: TypedSocketServer;
  }
}
