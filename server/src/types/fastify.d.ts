import 'fastify';


declare module 'fastify' {
  interface FastifyInstance {
    io: Socket.Server; 
  }
}

declare module 'fastify-socket.io' {
  import { FastifyPluginAsync } from 'fastify';

  interface FastifySocketIOOptions {
    cors?: {
      origin: string | string[] | boolean;
      methods: string[];
    };
  }

  const fastifySocketIO: FastifyPluginAsync<FastifySocketIOOptions>;
  export = fastifySocketIO;
}