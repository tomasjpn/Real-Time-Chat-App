import { Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { connectedUsersMap, socketToUuidMap } from '../types/server.js';
import { getUserByName, createUser } from '../models/userModel.js';
import { createChatroom, addUserToChatroom } from '../models/index.js';
import {
  NEW_USER,
  SELF_ID,
  USER_LIST,
} from '../socket-events/socket-events.js';

export function registerUserHandlers(
  socket: Socket,
  server: FastifyInstance,
  connectedUsers: connectedUsersMap,
  socketToUuid: socketToUuidMap
): void {
  socket.on(NEW_USER, async (userName: string) => {
    try {
      let userUuid: string;
      let userId: number;

      const existingUser = await getUserByName(userName);

      if (existingUser) {
        server.log.info('Existing user found:', existingUser);
        userUuid = existingUser.uuid;
        userId = existingUser.id;
      } else {
        const insertedUser = await createUser(userName);
        userId = insertedUser.id;
        userUuid = insertedUser.uuid;

        const insertedChatroom = await createChatroom(`room_${userUuid}`);
        const chatroomId = insertedChatroom.id;

        await addUserToChatroom(userId, chatroomId);
      }

      // Store user information in memory
      connectedUsers[userUuid] = {
        socketId: socket.id,
        userName: userName,
        dbUserId: userId,
      };

      // Reverse mapping from socket to UUID
      socketToUuid[socket.id] = userUuid;

      // Send the user their own UUID and the current user list
      socket.emit(SELF_ID, userUuid);

      // Transform the user list to send to clients
      const userListForClients = Object.entries(connectedUsers).reduce(
        (acc, [uuid, data]) => {
          acc[uuid] = data.userName;
          return acc;
        },
        {} as Record<string, string>
      );

      server.io.emit(USER_LIST, userListForClients);
    } catch (error) {
      console.error('Error creating new user:', error);
    }
  });
}
