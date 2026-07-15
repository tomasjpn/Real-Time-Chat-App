import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const CONFIG = {
  app: {
    // 0.0.0.0 is required so the server is reachable from other devices on
    // the local network, not just from localhost.
    host: process.env.APP_HOST || '0.0.0.0',
    port: Number(process.env.APP_PORT) || 3000,
  },
  db: {
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT) || 5432,
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    connectionString: requireEnv('DATABASE_URL_CONNECTION_STRING'),
  },
  corsOrigins: (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
