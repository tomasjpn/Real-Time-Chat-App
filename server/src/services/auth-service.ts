import { createHash, randomBytes } from 'node:crypto';
import {
  hash as argonHash,
  verify as argonVerify,
  Algorithm,
} from '@node-rs/argon2';
import { CONFIG } from '../../db/config/config.js';
import { UserRecord } from '../types/server.js';
import {
  createUser,
  getUserWithPasswordByUsername,
} from '../models/user-model.js';
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
} from '../models/refresh-token-model.js';

/** Argon2id per current OWASP password storage guidance. */
const ARGON2_OPTIONS = { algorithm: Algorithm.Argon2id };

/** Constant dummy hash so login timing doesn't reveal whether a user exists. */
const DUMMY_HASH_PROMISE = argonHash('invalid-password', ARGON2_OPTIONS);

export class UsernameTakenError extends Error {
  constructor() {
    super('Username is already taken');
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password');
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Drizzle wraps driver errors (DrizzleQueryError.cause holds the pg error). */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 3; depth++) {
    if ((current as { code?: string }).code === '23505') {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

//------------------------------------------------------------------------------

export async function registerUser(
  username: string,
  displayName: string,
  password: string
): Promise<UserRecord> {
  const passwordHash = await argonHash(password, ARGON2_OPTIONS);

  try {
    return await createUser(username, displayName, passwordHash);
  } catch (error) {
    // The UNIQUE constraint is the source of truth for username collisions;
    // any pre-check is advisory only (two registrations can race).
    if (isUniqueViolation(error)) {
      throw new UsernameTakenError();
    }
    throw error;
  }
}

export async function verifyLogin(
  username: string,
  password: string
): Promise<UserRecord> {
  const user = await getUserWithPasswordByUsername(username);

  if (!user) {
    // Burn comparable time as a real verification, then fail generically.
    await argonVerify(await DUMMY_HASH_PROMISE, password).catch(() => false);
    throw new InvalidCredentialsError();
  }

  const valid = await argonVerify(user.passwordHash, password).catch(
    () => false
  );
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

/** Creates a refresh token, stores only its hash, returns the raw value. */
export async function issueRefreshToken(
  userId: string,
  userAgent?: string
): Promise<string> {
  const rawToken = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + CONFIG.auth.refreshTokenTtlMs);

  await createRefreshToken(userId, sha256(rawToken), expiresAt, userAgent);

  return rawToken;
}

/**
 * Rotates a refresh token: the presented token is revoked and a new one is
 * issued. Presenting an already-revoked token is treated as theft and
 * revokes every active session of that user.
 */
export async function rotateRefreshToken(
  rawToken: string,
  userAgent?: string
): Promise<{ userId: string; newRawToken: string } | null> {
  const record = await findRefreshTokenByHash(sha256(rawToken));

  if (!record) {
    return null;
  }

  if (record.revokedAt) {
    await revokeAllUserRefreshTokens(record.userId);
    return null;
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await revokeRefreshToken(record.id);
  const newRawToken = await issueRefreshToken(record.userId, userAgent);

  return { userId: record.userId, newRawToken };
}

export async function revokeRefreshTokenByRawValue(
  rawToken: string
): Promise<void> {
  const record = await findRefreshTokenByHash(sha256(rawToken));
  if (record && !record.revokedAt) {
    await revokeRefreshToken(record.id);
  }
}
