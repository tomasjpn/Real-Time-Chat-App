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

export type privateMessagePayload = {
  targetId: string;
  message: string;
};

export type fetchedChatHistoryPayload = {
  targetId: string;
};

export type ChatHistoryMessages = {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isSelf: boolean;
};
