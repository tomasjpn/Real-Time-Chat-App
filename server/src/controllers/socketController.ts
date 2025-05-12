import { Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { connectedUsersMap, socketToUuidMap } from '../types/server.js';
import { registerUserHandlers } from './userController.js';
import { registerMessageHandlers } from './messageController.js';

// Central store for connected users
export const connectedUsers: connectedUsersMap = {};

// Reverse mapping for quick lookup: { socketId: uuid }
export const socketToUuid: socketToUuidMap = {};

export function initializeSocketControllers(server: FastifyInstance): void {
  server.ready((err) => {
    if (err) throw err;

    /*
     * "io" => represents the Socket.IO server instance;
     *   - server.io.on => WebSocket connections and communication between clients and the server;
     *
     * socket.on => no real-time Websocket connection from Socket.IO rather just fastify own events
     */

    server.io.on('connection', (socket: Socket) => {
      server.log.info('A user connected:', socket.id);

      registerUserHandlers(socket, server, connectedUsers, socketToUuid);
      registerMessageHandlers(socket, server, connectedUsers, socketToUuid);

      // Handle socket disconnection
      socket.on('disconnect', () => {
        server.log.info('User disconnected:', socket.id);

        // Find and remove user by socket ID
        const userUuid = socketToUuid[socket.id];
        if (userUuid) {
          delete connectedUsers[userUuid];
          delete socketToUuid[socket.id];

          // Transform the user list to send to clients
          const userListForClients = Object.entries(connectedUsers).reduce(
            (acc, [uuid, data]) => {
              acc[uuid] = data.userName;
              return acc;
            },
            {} as Record<string, string>
          );

          server.io.emit('user-list', userListForClients);
        }
      });
    });
  });
}
