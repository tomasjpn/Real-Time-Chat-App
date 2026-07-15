import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
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
}
