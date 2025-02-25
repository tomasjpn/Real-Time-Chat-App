import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { sql } from 'drizzle-orm';

const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'real_time_chat_app',
});

export const db = drizzle(pool);

// Run migrations
export async function initializeDatabase() {
  console.log('Running migrations...');

  try {
    // Create the users table
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Create the chatrooms table
    await db.execute(sql`
      CREATE TABLE chatrooms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Junction table (join table) many -> many  relation
    await db.execute(sql`
      CREATE TABLE user_chatrooms (
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
       PRIMARY KEY (user_id, chatroom_id)
      );
    `);

    // Create the messages table
    await db.execute(sql`
      CREATE TABLE messages (
       id SERIAL PRIMARY KEY,
       chatroom_id INTEGER REFERENCES chatrooms(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}
