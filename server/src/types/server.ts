import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@chat/shared';

/** Identity attached to every socket by the handshake auth middleware. */
export interface SocketData {
  userId: string;
  username: string;
  displayName: string;
}

type InterServerEvents = Record<string, never>;

/** Socket.IO server/socket bound to the shared event contract. */
export type TypedSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/** JWT payload for access tokens. */
export interface AccessTokenPayload {
  sub: string;
  username: string;
  displayName: string;
}

export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
};

export type ConnectedUser = {
  socketId: string;
  userName: string;
};

export type connectedUsersMap = Record<string, ConnectedUser>;

/** socket.id -> user id */
export type socketToUserIdMap = Record<string, string>;

export type ChatroomRecord = {
  id: number;
  name: string;
};
