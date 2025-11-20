import { FastifyInstance } from 'fastify';
import { db } from '../../db/config/db.js';
import { eq } from 'drizzle-orm';
import { users } from '../../db/schema.js';
import { getSharedChatroom } from '../models/chatroom-model.js';
import { getChatHistoryFromDb } from '../models/message-model.js';

export default async function chatRoutes(server: FastifyInstance) {
  server.get(
    '/chat-history/:userUuid/:targetUserUuid',
    async (request, reply) => {
      const { userUuid, targetUserUuid } = request.params as {
        userUuid: string;
        targetUserUuid: string;
      };
      try {
        server.log.info(
          `Fetching chat history between users ${userUuid} and ${targetUserUuid}`
        );
        const getUserResult = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uuid, userUuid))
          .limit(1);
        const getTargetUserResult = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.uuid, targetUserUuid))
          .limit(1);

        if (!getUserResult.length || !getTargetUserResult.length) {
          return reply.code(404).send({ error: 'One or both users not found' });
        }

        const userId = getUserResult[0].id;
        const targetUserId = getTargetUserResult[0].id;
        server.log.debug(`Found user IDs: ${userId} and ${targetUserId}`);

        const sharedChatroomId = await getSharedChatroom(userId, targetUserId);
        if (!sharedChatroomId) {
          server.log.info(
            `No shared chatrooms found between users ${userUuid} and ${targetUserUuid}`
          );
          return reply.send({ messages: [] });
        }
        server.log.debug(`Found shared chatroom: ${sharedChatroomId}`);

        const chatHistory = await getChatHistoryFromDb(
          sharedChatroomId,
          userUuid
        );
        server.log.info(
          `Successfully retrieved ${chatHistory.length} messages from chatroom ${sharedChatroomId}`
        );
        return reply.send({ formattedMessages: chatHistory });
      } catch (error) {
        server.log.error(
          { err: error },
          `Error fetching chat history between users ${userUuid} and ${targetUserUuid}`
        );
        return reply.code(500).send({ error: 'Failed to fetch chat history' });
      }
    }
  );
}
