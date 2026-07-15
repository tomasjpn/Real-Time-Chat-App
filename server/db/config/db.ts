import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { FastifyInstance } from 'fastify';
import pkg from 'pg';
import { CONFIG } from './config.js';
import * as schema from '../schema.js';

const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: CONFIG.db.host,
  port: CONFIG.db.port,
  user: CONFIG.db.user,
  password: CONFIG.db.password,
  database: CONFIG.db.database,
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
