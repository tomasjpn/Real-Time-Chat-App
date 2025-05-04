import { FastifyInstance } from 'fastify';
import { db } from '../../db/config/db.js';
import { sql } from 'drizzle-orm';

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
        const getUserResult = await db.execute(sql`
                SELECT id FROM users WHERE uuid = ${userUuid} LIMIT 1
              `);

        const getTargetUserResult = await db.execute(sql`
                SELECT id FROM users WHERE uuid = ${targetUserUuid} LIMIT 1
              `);

        if (!getUserResult.rows.length || !getTargetUserResult.rows.length) {
          return reply.code(404).send({ error: 'One or both users not found' });
        }

        const userId = getUserResult.rows[0].id;
        const targetUserId = getTargetUserResult.rows[0].id;
        server.log.debug(`Found user IDs: ${userId} and ${targetUserId}`);

        const sharedChatroomsResult = await db.execute(sql`
                SELECT uc1.chatroom_id 
                FROM user_chatrooms uc1
                JOIN user_chatrooms uc2 ON uc1.chatroom_id = uc2.chatroom_id
                WHERE uc1.user_id = ${userId} AND uc2.user_id = ${targetUserId}
                LIMIT 1
              `);

        if (!sharedChatroomsResult.rows.length) {
          server.log.info(
            `No shared chatrooms found between users ${userUuid} and ${targetUserUuid}`
          );
          return reply.send({ messages: [] });
        }

        const extractedChatroomId = sharedChatroomsResult.rows[0].chatroom_id;
        server.log.debug(`Found shared chatroom: ${extractedChatroomId}`);

        // Get messages from this chatroom with sender information
        const getMessagesResult = await db.execute(sql`
                  SELECT m.id, m.user_id, m.content, m.created_at, u.name as sender_name, u.uuid as sender_uuid
                  FROM messages m
                  JOIN users u ON m.user_id = u.id
                  WHERE m.chatroom_id = ${extractedChatroomId}
                  ORDER BY m.created_at ASC
                `);

        // Format messages for client
        const formattedMessages = getMessagesResult.rows.map((msg) => ({
          senderId: msg.sender_uuid,
          senderName: msg.sender_name,
          message: msg.content,
          timestamp: msg.created_at,
          isSelf: msg.sender_uuid === userUuid,
        }));

        server.log.info(
          `Successfully retrieved ${formattedMessages.length} messages from chatroom ${extractedChatroomId}`
        );
        return reply.send({ formattedMessages });
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
