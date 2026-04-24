import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    io: import('socket.io').Server;
  }
}
