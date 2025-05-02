import { drizzle } from 'drizzle-orm/node-postgres';
import { FastifyInstance } from 'fastify';
import pkg from 'pg';
import { sql } from 'drizzle-orm';
import { CONFIG } from './config.js';

const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: CONFIG.server.host,
  port: Number(CONFIG.server.port),
  user: CONFIG.server.user,
  password: CONFIG.server.password,
  database: CONFIG.server.database,
});

export const db = drizzle(pool);

// Run migrations
export async function initializeDatabase(server: FastifyInstance) {
  try {
    server.log.info('Initializing database: starting migration process...');

    server.log.info(
      'Dropping existing tables: messages, user_chatrooms, chatrooms, users'
    );
    await db.execute(sql`DROP TABLE IF EXISTS messages CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS user_chatrooms CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS chatrooms CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);

    server.log.info('Creating table: users');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uuid UUID NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    server.log.info('Creating table: chatrooms');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chatrooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    server.log.info(
      'Creating table: user_chatrooms (junction table for users <-> chatrooms)'
    );
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_chatrooms (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, chatroom_id)
      );
    `);

    server.log.info('Creating table: messages');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    server.log.info('Database setup completed successfully');
    return true;
  } catch (error) {
    server.log.error('Database setup failed:', error);
    return false;
  }
}
