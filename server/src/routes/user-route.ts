import { FastifyInstance } from 'fastify';
import { db } from '../../db/config/db.js';
import { users } from '../../db/schema.js';

export async function userRoutes(server: FastifyInstance) {
  server.get(
    '/users',
    { onRequest: [server.authenticate] },
    async (request, reply) => {
      try {
        // Public columns only — never expose password_hash
        const result = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
          })
          .from(users);
        return result;
      } catch (error) {
        server.log.error({ err: error }, 'Error fetching users');
        return reply.code(500).send({ error: 'Failed to fetch users' });
      }
    }
  );
}
