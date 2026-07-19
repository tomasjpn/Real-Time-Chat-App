import { db } from '../../db/config/db.js';
import { asc, eq } from 'drizzle-orm';
import { ChatMessageDTO } from '@chat/shared';
import { messages, users } from '../../db/schema.js';

export async function saveMessageToDb(
  chatroomId: number,
  userId: string,
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
  currentUserId: string
): Promise<ChatMessageDTO[]> {
  const getMessagesResult = await db
    .select({
      senderId: users.id,
      senderName: users.displayName,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.chatroomId, chatroomId))
    .orderBy(asc(messages.createdAt));

  return getMessagesResult.map((msg) => ({
    senderId: msg.senderId,
    senderName: msg.senderName,
    message: msg.content,
    timestamp: msg.createdAt,
    isSelf: msg.senderId === currentUserId,
  }));
}
