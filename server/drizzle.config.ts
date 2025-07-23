import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SERVER_HOST || 'localhost',
    port: Number(process.env.SERVER_PORT) || 5432,
    user: process.env.SERVER_USER || 'postgres',
    password: process.env.SERVER_PASSWORD || '',
    database: process.env.SERVER_DATABASE || 'real-time-chat-app',
    ssl: false,
  },
});
