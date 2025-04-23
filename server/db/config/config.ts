import dotenv from 'dotenv';

dotenv.config();

console.log('Environment variables loaded:', {
  SERVER_PORT: process.env.SERVER_PORT,
  SERVER_HOST: process.env.SERVER_HOST,
  SERVER_USER: process.env.SERVER_USER,
  SERVER_PASSWORD: process.env.SERVER_PASSWORD,
  SERVER_DATABASE: process.env.SERVER_DATABASE,
  PASSWORD_TYPE: typeof process.env.SERVER_PASSWORD,
});

export const CONFIG = {
  server: {
    port: process.env.SERVER_PORT,
    host: process.env.SERVER_HOST,
    user: process.env.SERVER_USER,
    password: process.env.SERVER_PASSWORD,
    database: process.env.SERVER_DATABASE,
  },
  db: {
    connectionString: process.env.DATABASE_URL_CONNECTION_STRING,
  },
};
