import { FastifyInstance } from 'fastify';
import { getUserById } from '../models/user-model.js';
import { getSharedChatroom } from '../models/chatroom-model.js';
import { getChatHistoryFromDb } from '../models/message-model.js';

export default async function chatRoutes(server: FastifyInstance) {
  server.get(
    '/chat-history/:targetUserId',
    { onRequest: [server.authenticate] },
    async (request, reply) => {
      // Own identity comes from the verified token, never from the URL
      const userId = request.user.sub;
      const { targetUserId } = request.params as { targetUserId: string };

      try {
        const targetUser = await getUserById(targetUserId);
        if (!targetUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const sharedChatroomId = await getSharedChatroom(userId, targetUserId);
        if (!sharedChatroomId) {
          return reply.send({ messages: [] });
        }

        const messages = await getChatHistoryFromDb(sharedChatroomId, userId);
        return reply.send({ messages });
      } catch (error) {
        server.log.error(
          { err: error, userId, targetUserId },
          'Error fetching chat history'
        );
        return reply.code(500).send({ error: 'Failed to fetch chat history' });
      }
    }
  );
}
