import { db } from '../../db/config/db.js';
import { asc, eq } from 'drizzle-orm';
import { messages, users } from '../../db/schema.js';

export interface MessageWithSender {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isSelf?: boolean;
}

export async function saveMessageToDb(
  chatroomId: number,
  userId: number,
  content: string
): Promise<void> {
  await db.insert(messages).values({
    chatroomId,
    userId,
    content,
  });
}

export async function getChatHistoryFromDb(
  chatroomId: number,
  currentUserUuid: string
): Promise<MessageWithSender[]> {
  const getMessagesResult = await db
    .select({
      id: messages.id,
      userId: messages.userId,
      content: messages.content,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderUuid: users.uuid,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.chatroomId, chatroomId))
    .orderBy(asc(messages.createdAt));

  return getMessagesResult.map((msg) => ({
    senderId: String(msg.senderUuid),
    senderName: String(msg.senderName),
    message: String(msg.content),
    timestamp:
      msg.createdAt instanceof Date
        ? msg.createdAt
        : typeof msg.createdAt === 'string' || typeof msg.createdAt === 'number'
          ? new Date(msg.createdAt)
          : new Date(),
    isSelf: String(msg.senderUuid) === currentUserUuid,
  }));
}
