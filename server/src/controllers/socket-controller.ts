import { FastifyInstance } from 'fastify';
import {
  connectedUsersMap,
  socketToUserIdMap,
  TypedSocket,
} from '../types/server.js';
import { registerMessageHandlers } from './message-controller.js';
import { SERVER_DISCONNECT, SERVER_CONNECTION, USER_LIST, SELF_ID } from '@chat/shared';

// Central store for connected users (single socket per user until Phase 3)
export const connectedUsers: connectedUsersMap = {};

// Reverse mapping for quick lookup: { socketId: userId }
export const socketToUserId: socketToUserIdMap = {};

function broadcastUserList(server: FastifyInstance): void {
  const userListForClients = Object.entries(connectedUsers).reduce(
    (acc, [userId, data]) => {
      acc[userId] = data.userName;
      return acc;
    },
    {} as Record<string, string>
  );

  server.io.emit(USER_LIST, userListForClients);
}

export function initializeSocketControllers(server: FastifyInstance): void {
  server.io.on(SERVER_CONNECTION, (socket: TypedSocket) => {
    // Identity was verified at the handshake; register presence directly.
    const { userId, displayName } = socket.data;
    server.log.info({ socketId: socket.id, userId }, 'A user connected');

    connectedUsers[userId] = {
      socketId: socket.id,
      userName: displayName,
    };
    socketToUserId[socket.id] = userId;

    socket.emit(SELF_ID, userId);
    broadcastUserList(server);

    registerMessageHandlers(socket, server, connectedUsers);

    socket.on(SERVER_DISCONNECT, () => {
      server.log.info({ socketId: socket.id, userId }, 'User disconnected');

      // Only clear presence if this socket is still the registered one
      if (connectedUsers[userId]?.socketId === socket.id) {
        delete connectedUsers[userId];
      }
      delete socketToUserId[socket.id];

      broadcastUserList(server);
    });
  });
}
