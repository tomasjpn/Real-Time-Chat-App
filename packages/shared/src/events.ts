import type {
  ChatHistoryPayload,
  PrivateMessageReceivedPayload,
  UserListPayload,
} from './dto.js';
import type { FetchChatHistoryInput, PrivateMessageInput } from './schemas.js';

/** Socket.IO event names shared by client and server. */
export const PRIVATE_MESSAGE = 'private-message';
export const FETCH_CHAT_HISTORY = 'fetch-chat-history';
export const CHAT_HISTORY = 'chat-history';
export const RECEIVE_PRIVATE_MESSAGE = 'receive-private-message';
export const USER_LIST = 'user-list';
export const CLIENT_CONNECTION = 'connect';
export const SERVER_CONNECTION = 'connection';
export const SERVER_DISCONNECT = 'disconnect';
export const SELF_ID = 'self-id';
export const CONNECT_ERROR = 'connect_error';
export const INVALID_USERNAME = 'invalid-username';

/**
 * Typed event maps for Socket.IO generics. Renaming an event or changing
 * a payload here breaks the build on both sides — by design.
 *
 * Identity is established at the Socket.IO handshake via the JWT in
 * `auth.token`; there is no username event. Invalid credentials reject
 * the connection with `connect_error`.
 */
export interface ServerToClientEvents {
  [SELF_ID]: (selfId: string) => void;
  [USER_LIST]: (users: UserListPayload) => void;
  [RECEIVE_PRIVATE_MESSAGE]: (payload: PrivateMessageReceivedPayload) => void;
  [CHAT_HISTORY]: (payload: ChatHistoryPayload) => void;
  [INVALID_USERNAME]: (message: string) => void;
}

export interface ClientToServerEvents {
  [PRIVATE_MESSAGE]: (payload: PrivateMessageInput) => void;
  [FETCH_CHAT_HISTORY]: (payload: FetchChatHistoryInput) => void;
}
