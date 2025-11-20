import { db } from '../../db/config/db.js';
import { eq, and } from 'drizzle-orm';
import { ChatroomRecord } from '../types/server.js';
import { chatrooms, userChatrooms } from '../../db/schema.js';
import { alias } from 'drizzle-orm/pg-core';

export async function createChatroom(name: string): Promise<ChatroomRecord> {
  const [insertedChatroomResult] = await db
    .insert(chatrooms)
    .values({ name })
    .returning();

  return insertedChatroomResult;
}

export async function addUserToChatroom(
  userId: number,
  chatroomId: number
): Promise<void> {
  await db.insert(userChatrooms).values({ userId, chatroomId });
}

export async function getSharedChatroom(
  userId1: number,
  userId2: number
): Promise<number | null> {
  const uc2 = alias(userChatrooms, 'uc2');

  const getSharedChatroomsResult = await db
    .select({ chatroomId: userChatrooms.chatroomId })
    .from(userChatrooms)
    .innerJoin(
      uc2,
      and(eq(userChatrooms.chatroomId, uc2.chatroomId), eq(uc2.userId, userId2))
    )
    .where(eq(userChatrooms.userId, userId1))
    .limit(1);

  return getSharedChatroomsResult.length > 0
    ? Number(getSharedChatroomsResult[0].chatroomId)
    : null;
}

export async function createSharedChatroom(
  userId1: number,
  userId2: number,
  chatroomName: string
): Promise<number> {
  const [newChatroomResult] = await db
    .insert(chatrooms)
    .values({ name: chatroomName })
    .returning({ chatroomId: chatrooms.id });

  await db.insert(userChatrooms).values([
    { userId: userId1, chatroomId: newChatroomResult.chatroomId },
    { userId: userId2, chatroomId: newChatroomResult.chatroomId },
  ]);

  return newChatroomResult.chatroomId;
}
