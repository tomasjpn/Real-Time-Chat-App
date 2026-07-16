import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@chat/shared';

/** Socket.IO server/socket bound to the shared event contract. */
export type TypedSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents
>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export type ConnectedUser = {
  socketId: string;
  userName: string;
  dbUserId?: number;
};

export type UserRecord = {
  id: number;
  uuid: string;
  name: string;
};

export type connectedUsersMap = Record<string, ConnectedUser>;

export type socketToUuidMap = Record<string, string>;

export type ChatroomRecord = {
  id: number;
  name: string;
};
