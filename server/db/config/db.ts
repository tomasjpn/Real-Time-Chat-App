import { drizzle } from 'drizzle-orm/node-postgres';
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
export async function initializeDatabase() {
  try {
    console.log('Running migrations...');

    // Create the users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Create the chatrooms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chatrooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Junction table (join table) many -> many  relation
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_chatrooms (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, chatroom_id)
      );
    `);

    // Create the messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}
