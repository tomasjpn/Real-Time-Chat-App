import { db } from '../../db/config/db.js';
import { eq } from 'drizzle-orm';
import { UserRecord } from '../types/server.js';
import { users } from '../../db/schema.js';

const publicUserColumns = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
};

/** Includes the password hash — only for credential verification. */
export async function getUserWithPasswordByUsername(
  username: string
): Promise<(UserRecord & { passwordHash: string }) | null> {
  const [result] = await db
    .select({ ...publicUserColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result ?? null;
}

export async function getUserByUsername(
  username: string
): Promise<UserRecord | null> {
  const [result] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return result ?? null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const [result] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result ?? null;
}

/** Throws the underlying Postgres error (code 23505) on username conflict. */
export async function createUser(
  username: string,
  displayName: string,
  passwordHash: string
): Promise<UserRecord> {
  const [inserted] = await db
    .insert(users)
    .values({ username, displayName, passwordHash })
    .returning(publicUserColumns);

  return inserted;
}
