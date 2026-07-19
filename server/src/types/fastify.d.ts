import 'fastify';
import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AccessTokenPayload, TypedSocketServer } from './server.js';

declare module 'fastify' {
  interface FastifyInstance {
    io: TypedSocketServer;
    /** onRequest guard: verifies the access token or replies 401. */
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}
