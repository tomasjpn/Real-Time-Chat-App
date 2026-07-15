import { FastifyInstance } from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import cors from '@fastify/cors';
import {
  createSocketIOServer,
  initializeSocketIO,
} from '../socket/socket-server.js';
import { CONFIG } from '../../db/config/config.js';

export async function registerPlugins(server: FastifyInstance) {
  // PostgreSQL
  await server.register(fastifyPostgres, {
    connectionString: CONFIG.db.connectionString,
  });
  server.log.info('PostgreSQL plugin registered.');

  // CORS
  await server.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  server.log.info('CORS plugin registered with origin http://localhost:5173.');
}
