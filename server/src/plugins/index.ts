import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { CONFIG } from '../../db/config/config.js';

export async function registerPlugins(server: FastifyInstance) {
  // CORS
  await server.register(cors, {
    origin: CONFIG.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  server.log.info({ origins: CONFIG.corsOrigins }, 'CORS plugin registered.');

  // Cookies (refresh token travels in an httpOnly cookie)
  await server.register(cookie);

  // JWT access tokens
  await server.register(jwt, {
    secret: CONFIG.auth.jwtSecret,
    sign: { expiresIn: CONFIG.auth.accessTokenTtl },
  });

  // Rate limiting — enabled per-route (login/register brute-force protection)
  await server.register(rateLimit, { global: false });

  // onRequest guard for protected routes
  server.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      await reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  server.log.info('Auth plugins registered (cookie, jwt, rate-limit).');
}
