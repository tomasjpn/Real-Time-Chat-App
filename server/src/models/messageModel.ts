import { db } from '../../db/config/db.js';
import { sql } from 'drizzle-orm';

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
  await db.execute(sql`
    INSERT INTO messages (chatroom_id, user_id, content) 
    VALUES (${chatroomId}, ${userId}, ${content})
  `);
}

export async function getChatHistoryFromDb(
  chatroomId: number,
  currentUserUuid: string
): Promise<MessageWithSender[]> {
  const getMessagesResult = await db.execute(sql`
    SELECT m.id, m.user_id, m.content, m.created_at, u.name as sender_name, u.uuid as sender_uuid
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.chatroom_id = ${chatroomId}
    ORDER BY m.created_at ASC
  `);

  const formattedMessages = getMessagesResult.rows.map((msg) => {
    const timestamp =
      msg.created_at instanceof Date
        ? msg.created_at
        : typeof msg.created_at === 'string' ||
            typeof msg.created_at === 'number'
          ? new Date(msg.created_at)
          : new Date();

    return {
      senderId: String(msg.sender_uuid),
      senderName: String(msg.sender_name),
      message: String(msg.content),
      timestamp: timestamp,
      isSelf: String(msg.sender_uuid) === currentUserUuid,
    };
  });

  return formattedMessages;
}
