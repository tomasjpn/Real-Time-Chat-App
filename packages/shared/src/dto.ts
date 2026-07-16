/**
 * Data transfer objects — the shapes that cross the wire between
 * server and client. Both sides import these, so a change here is a
 * compile error on both sides instead of a silent runtime mismatch.
 */

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

/** Map of connected users: uuid -> display name. */
export type UserListPayload = Record<string, string>;
