/**
 * Data transfer objects — the shapes that cross the wire between
 * server and client. Both sides import these, so a change here is a
 * compile error on both sides instead of a silent runtime mismatch.
 */

export interface UserDTO {
  id: string;
  username: string;
  displayName: string;
}

/** Response of register/login/refresh. The refresh token itself travels
 *  only in an httpOnly cookie and never appears in a response body. */
export interface AuthSuccessDTO {
  user: UserDTO;
  accessToken: string;
}

export interface ApiErrorDTO {
  error: string;
}

export interface UsernameAvailabilityDTO {
  available: boolean;
  reason?: string;
}

export interface ChatMessageDTO {
  senderId: string;
  senderName: string;
  message: string;
  isSelf: boolean;
  /** ISO string on the wire; Date on the server before serialization. */
  timestamp?: string | Date;
}

export interface PrivateMessageReceivedPayload {
  senderId: string;
  senderName: string;
  message: string;
}

export interface ChatHistoryPayload {
  messages: ChatMessageDTO[];
  error?: string;
}

/** Map of connected users: user id -> display name. */
export type UserListPayload = Record<string, string>;
