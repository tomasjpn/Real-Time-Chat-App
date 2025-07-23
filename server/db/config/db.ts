import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { FastifyInstance } from 'fastify';
import pkg from 'pg';
import { CONFIG } from './config.js';
import * as schema from '../schema.js';

const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: CONFIG.server.host,
  port: Number(CONFIG.server.port),
  user: CONFIG.server.user,
  password: CONFIG.server.password,
  database: CONFIG.server.database,
});

export const db = drizzle(pool, { schema });

// Run migrations
export async function initializeDatabase(server: FastifyInstance) {
  try {
    server.log.info('Initializing database: starting migration process...');

    await migrate(db, {
      migrationsFolder: './drizzle',
    });

    server.log.info('Database setup completed successfully');
    return true;
  } catch (error) {
    server.log.error(error, 'Database setup failed:');
    return false;
  }
}
