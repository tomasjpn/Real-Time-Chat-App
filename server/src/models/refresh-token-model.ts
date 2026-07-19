import { db } from '../../db/config/db.js';
import { and, eq, isNull } from 'drizzle-orm';
import { refreshTokens } from '../../db/schema.js';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  userAgent?: string
): Promise<void> {
  await db
    .insert(refreshTokens)
    .values({ userId, tokenHash, expiresAt, userAgent });
}

export async function findRefreshTokenByHash(
  tokenHash: string
): Promise<RefreshTokenRecord | null> {
  const [result] = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      tokenHash: refreshTokens.tokenHash,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  return result ?? null;
}

export async function revokeRefreshToken(id: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, id));
}

/** Theft response: a revoked token was presented again, kill the session family. */
export async function revokeAllUserRefreshTokens(
  userId: string
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt))
    );
}
