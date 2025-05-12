import { db } from '../../db/config/db.js';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { UserRecord } from '../types/server.js';

export async function getUserByName(
  userName: string
): Promise<UserRecord | null> {
  const result = await db.execute(sql`
    SELECT id, uuid, name FROM users WHERE name = ${userName} LIMIT 1
  `);

  return result.rows && result.rows.length > 0
    ? (result.rows[0] as UserRecord)
    : null;
}

export async function createUser(userName: string): Promise<UserRecord> {
  // Generate UUID for the user
  const userUuid = uuidv4();

  // Insert the user into the database
  const insertedUserResult = await db.execute(sql`
    INSERT INTO users (uuid, name) VALUES (${userUuid}, ${userName}) RETURNING *
  `);

  // Extract user data from the result
  const extractedInsertedUser = Array.isArray(insertedUserResult)
    ? (insertedUserResult[0] as UserRecord)
    : (insertedUserResult.rows[0] as UserRecord);

  return extractedInsertedUser;
}

export async function getUserById(uuid: string): Promise<UserRecord | null> {
  const getUserResult = await db.execute(sql`
    SELECT id, uuid, name FROM users WHERE uuid = ${uuid} LIMIT 1
  `);

  return getUserResult.rows && getUserResult.rows.length > 0
    ? (getUserResult.rows[0] as UserRecord)
    : null;
}
