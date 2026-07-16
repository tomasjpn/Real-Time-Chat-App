import { FastifyInstance } from 'fastify';
import {
  connectedUsersMap,
  socketToUuidMap,
  TypedSocket,
} from '../types/server.js';
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
  connectedUsers: connectedUsersMap,
  socketToUuid: socketToUuidMap
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

      // Get sender's UUID from socketId
      const senderUuid = socketToUuid[socket.id];
      if (!senderUuid || !connectedUsers[senderUuid]) {
        server.log.warn('Unknown sender, message discarded');
        return;
      }

      const senderName = connectedUsers[senderUuid].userName;
      server.log.info(
        `Private message from ${senderName} (${senderUuid}) to ${targetId}: ${message}`
      );

      if (!connectedUsers[targetId]) {
        server.log.warn({ targetId }, 'Target user not found');
        return;
      }

      const targetSocketId = connectedUsers[targetId].socketId;

      try {
        const userId = connectedUsers[senderUuid].dbUserId;
        const targetUserId = connectedUsers[targetId].dbUserId;
        let chatroomId;

        if (!userId || !targetUserId) {
          server.log.warn(
            'User ID not found in memory, sending message without saving to DB'
          );
          server.io.to(targetSocketId).emit(RECEIVE_PRIVATE_MESSAGE, {
            senderId: senderUuid,
            senderName: senderName,
            message: message,
          });
          return;
        }

        chatroomId = await getSharedChatroom(userId, targetUserId);

        if (!chatroomId) {
          chatroomId = await createSharedChatroom(
            userId,
            targetUserId,
            `room_${senderUuid}_${targetId}`
          );
        }

        await saveMessageToDb(chatroomId, userId, message);

        server.io.to(targetSocketId).emit(RECEIVE_PRIVATE_MESSAGE, {
          senderId: senderUuid,
          senderName: senderName,
          message: message,
        });
      } catch (error) {
        console.error('Error sending private message:', error);
        server.io.to(targetSocketId).emit(RECEIVE_PRIVATE_MESSAGE, {
          senderId: senderUuid,
          senderName: senderName,
          message: message,
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

    const senderUuid = socketToUuid[socket.id];
    if (!senderUuid || !connectedUsers[senderUuid]) {
      server.log.warn('Unknown sender, cannot fetch chat history');
      return;
    }

    try {
      const currentUser = await getUserById(senderUuid);
      const targetUser = await getUserById(targetId);

      if (!currentUser || !targetUser) {
        socket.emit(CHAT_HISTORY, {
          error: 'One or both users not found',
          messages: [],
        });
        return;
      }

      let chatroomId = await getSharedChatroom(currentUser.id, targetUser.id);

      if (!chatroomId) {
        chatroomId = await createSharedChatroom(
          currentUser.id,
          targetUser.id,
          `room_${senderUuid}_${targetId}`
        );

        // No messages yet in a new chatroom
        socket.emit(CHAT_HISTORY, { messages: [] });
        return;
      }

      const messages = await getChatHistoryFromDb(chatroomId, senderUuid);

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
