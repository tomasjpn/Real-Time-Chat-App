import { db } from '../../db/config/db.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { UserRecord } from '../types/server.js';
import { users } from '../../db/schema.js';

export async function getUserByName(
  userName: string
): Promise<UserRecord | null> {
  const [result] = await db
    .select({
      id: users.id,
      uuid: users.uuid,
      name: users.name,
    })
    .from(users)
    .where(eq(users.name, userName))
    .limit(1);

  return result ?? null;
}

export async function createUser(userName: string): Promise<UserRecord> {
  const userUuid = uuidv4();

  const [insertedUserResult] = await db
    .insert(users)
    .values({ uuid: userUuid, name: userName })
    .returning({ id: users.id, uuid: users.uuid, name: users.name });

  return insertedUserResult;
}

export async function getUserById(uuid: string): Promise<UserRecord | null> {
  const [getUserResult] = await db
    .select({
      id: users.id,
      uuid: users.uuid,
      name: users.name,
    })
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  return getUserResult ?? null;
}
