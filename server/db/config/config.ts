import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // App server (Fastify). 0.0.0.0 is required so the server is reachable
  // from other devices on the local network, not just from localhost.
  APP_HOST: z.string().default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DATABASE_URL_CONNECTION_STRING: z.string().url(),

  // Comma-separated list of allowed browser origins (CORS + Socket.IO)
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:4173,http://localhost:5174,http://192.168.178.79:5174'
    ),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const env = parsed.data;

export const CONFIG = {
  app: {
    host: env.APP_HOST,
    port: env.APP_PORT,
  },
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionString: env.DATABASE_URL_CONNECTION_STRING,
  },
  corsOrigins: env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  auth: {
    jwtSecret: env.JWT_SECRET,
    accessTokenTtl: '15m',
    refreshTokenTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    refreshCookieName: 'refresh_token',
    // Cookie is scoped to the auth routes so it is not sent on every request
    refreshCookiePath: '/auth',
  },
};
