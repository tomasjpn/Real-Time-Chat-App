import { FastifyInstance } from 'fastify';
import { db } from '../../db/config/db.js';
import { sql } from 'drizzle-orm';

export async function userRoutes(server: FastifyInstance) {
  server.get('/users', async () => {
    try {
      const users = await db.execute(sql`SELECT * FROM users`);
      return users;
    } catch (error) {
      server.log.error('Error fetching users:', error);
      return { error: 'Failed to fetch users' };
    }
  });
}
