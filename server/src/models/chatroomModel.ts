import { db } from '../../db/config/db.js';
import { sql } from 'drizzle-orm';
import { ChatroomRecord } from '../types/server.js';

export async function createChatroom(name: string): Promise<ChatroomRecord> {
  const insertedChatroomResult = await db.execute(sql`
    INSERT INTO chatrooms (name) VALUES (${name}) RETURNING *
  `);

  const extractedInsertedChatroom = Array.isArray(insertedChatroomResult)
    ? (insertedChatroomResult[0] as ChatroomRecord)
    : (insertedChatroomResult.rows[0] as ChatroomRecord);

  return extractedInsertedChatroom;
}

export async function addUserToChatroom(
  userId: number,
  chatroomId: number
): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_chatrooms (user_id, chatroom_id) 
    VALUES (${userId}, ${chatroomId})
  `);
}

export async function getSharedChatroom(
  userId1: number,
  userId2: number
): Promise<number | null> {
  const getSharedChatroomsResult = await db.execute(sql`
    SELECT uc1.chatroom_id 
    FROM user_chatrooms uc1
    JOIN user_chatrooms uc2 ON uc1.chatroom_id = uc2.chatroom_id
    WHERE uc1.user_id = ${userId1} AND uc2.user_id = ${userId2}
    LIMIT 1
  `);

  if (
    getSharedChatroomsResult.rows &&
    getSharedChatroomsResult.rows.length > 0
  ) {
    return Number(getSharedChatroomsResult.rows[0].chatroom_id);
  }

  return null;
}

export async function createSharedChatroom(
  userId1: number,
  userId2: number,
  chatroomName: string
): Promise<number> {
  const newChatroomResult = await db.execute(sql`
    INSERT INTO chatrooms (name) 
    VALUES (${chatroomName}) 
    RETURNING id
  `);

  const chatroomId = Number(newChatroomResult.rows[0].id);

  await db.execute(sql`
    INSERT INTO user_chatrooms (user_id, chatroom_id) 
    VALUES (${userId1}, ${chatroomId}), (${userId2}, ${chatroomId})
  `);

  return chatroomId;
}
