import { FastifyInstance } from 'fastify';
import { connectedUsersMap, TypedSocket } from '../types/server.js';
import { getUserById } from '../models/user-model.js';
import { getSharedChatroom, createSharedChatroom } from '../models/index.js';
import { saveMessageToDb, getChatHistoryFromDb } from '../models/index.js';
import {
  CHAT_HISTORY,
  FETCH_CHAT_HISTORY,
  PRIVATE_MESSAGE,
  RECEIVE_PRIVATE_MESSAGE,
  fetchChatHistorySchema,
  privateMessageSchema,
} from '@chat/shared';

export function registerMessageHandlers(
  socket: TypedSocket,
  server: FastifyInstance,
  connectedUsers: connectedUsersMap
): void {
  socket.on(
    PRIVATE_MESSAGE,
    async (rawPayload: { targetId: string; message: string }) => {
      const parsed = privateMessageSchema.safeParse(rawPayload);
      if (!parsed.success) {
        server.log.warn(
          { issues: parsed.error.issues },
          'Rejected invalid private-message payload'
        );
        return;
      }
      const { targetId, message } = parsed.data;

      // Identity comes from the authenticated handshake, never the payload
      const senderId = socket.data.userId;
      const senderName = socket.data.displayName;

      server.log.info(
        { senderId, targetId },
        'Private message'
      );

      if (!connectedUsers[targetId]) {
        server.log.warn({ targetId }, 'Target user not connected');
        return;
      }

      const targetSocketId = connectedUsers[targetId].socketId;

      try {
        let chatroomId = await getSharedChatroom(senderId, targetId);

        if (!chatroomId) {
          chatroomId = await createSharedChatroom(
            senderId,
            targetId,
            `room_${senderId}_${targetId}`
          );
        }

        await saveMessageToDb(chatroomId, senderId, message);

        server.io.to(targetSocketId).emit(RECEIVE_PRIVATE_MESSAGE, {
          senderId,
          senderName,
          message,
        });
      } catch (error) {
        server.log.error({ err: error }, 'Error sending private message');
        server.io.to(targetSocketId).emit(RECEIVE_PRIVATE_MESSAGE, {
          senderId,
          senderName,
          message,
        });
      }
    }
  );

  socket.on(FETCH_CHAT_HISTORY, async (rawPayload: { targetId: string }) => {
    const parsed = fetchChatHistorySchema.safeParse(rawPayload);
    if (!parsed.success) {
      server.log.warn(
        { issues: parsed.error.issues },
        'Rejected invalid fetch-chat-history payload'
      );
      return;
    }
    const { targetId } = parsed.data;
    const senderId = socket.data.userId;

    try {
      const targetUser = await getUserById(targetId);
      if (!targetUser) {
        socket.emit(CHAT_HISTORY, {
          error: 'User not found',
          messages: [],
        });
        return;
      }

      const chatroomId = await getSharedChatroom(senderId, targetId);

      if (!chatroomId) {
        // No conversation yet — history is simply empty; the room is
        // created lazily when the first message is sent.
        socket.emit(CHAT_HISTORY, { messages: [] });
        return;
      }

      const messages = await getChatHistoryFromDb(chatroomId, senderId);

      socket.emit(CHAT_HISTORY, { messages });
    } catch (error) {
      server.log.error({ err: error }, 'Error fetching chat history');
      socket.emit(CHAT_HISTORY, {
        error: 'Failed to fetch chat history',
        messages: [],
      });
    }
  });
}
