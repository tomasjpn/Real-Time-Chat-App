import { FastifyInstance, FastifyReply } from 'fastify';
import {
  loginSchema,
  registerSchema,
  usernameSchema,
  type AuthSuccessDTO,
  type UsernameAvailabilityDTO,
} from '@chat/shared';
import { CONFIG } from '../../db/config/config.js';
import { UserRecord } from '../types/server.js';
import { getUserById, getUserByUsername } from '../models/user-model.js';
import {
  InvalidCredentialsError,
  issueRefreshToken,
  registerUser,
  revokeRefreshTokenByRawValue,
  rotateRefreshToken,
  UsernameTakenError,
  verifyLogin,
} from '../services/auth-service.js';

const LOGIN_RATE_LIMIT = {
  rateLimit: { max: 10, timeWindow: '1 minute' },
};

function setRefreshCookie(reply: FastifyReply, rawToken: string): void {
  reply.setCookie(CONFIG.auth.refreshCookieName, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    // v1 runs over plain HTTP on the LAN; flip to true behind TLS
    secure: false,
    path: CONFIG.auth.refreshCookiePath,
    maxAge: Math.floor(CONFIG.auth.refreshTokenTtlMs / 1000),
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(CONFIG.auth.refreshCookieName, {
    path: CONFIG.auth.refreshCookiePath,
  });
}

async function buildAuthSuccess(
  server: FastifyInstance,
  user: UserRecord
): Promise<AuthSuccessDTO> {
  const accessToken = server.jwt.sign({
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
  });
  return { user, accessToken };
}

export async function authRoutes(server: FastifyInstance) {
  server.post(
    '/auth/register',
    { config: LOGIN_RATE_LIMIT },
    async (request, reply) => {
      const registerResult = registerSchema.safeParse(request.body);
      if (!registerResult.success) {
        return reply.code(400).send({
          error: registerResult.error.issues[0]?.message ?? 'Invalid input',
        });
      }

      const { username, password } = registerResult.data;
      const displayName = registerResult.data.displayName || username;

      try {
        const user = await registerUser(username, displayName, password);
        const refreshToken = await issueRefreshToken(
          user.id,
          request.headers['user-agent']
        );
        setRefreshCookie(reply, refreshToken);
        return reply.code(201).send(await buildAuthSuccess(server, user));
      } catch (error) {
        if (error instanceof UsernameTakenError) {
          return reply.code(409).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  server.post(
    '/auth/login',
    { config: LOGIN_RATE_LIMIT },
    async (request, reply) => {
      const loginResult = loginSchema.safeParse(request.body);
      if (!loginResult.success) {
        // Same generic message as a failed login — don't leak which part failed
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      try {
        const user = await verifyLogin(
          loginResult.data.username,
          loginResult.data.password
        );
        const refreshToken = await issueRefreshToken(
          user.id,
          request.headers['user-agent']
        );
        setRefreshCookie(reply, refreshToken);
        return reply.send(await buildAuthSuccess(server, user));
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.code(401).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  server.post(
    '/auth/refresh',
    { config: LOGIN_RATE_LIMIT },
    async (request, reply) => {
      const rawToken = request.cookies[CONFIG.auth.refreshCookieName];
      if (!rawToken) {
        return reply.code(401).send({ error: 'No session' });
      }

      const rotated = await rotateRefreshToken(
        rawToken,
        request.headers['user-agent']
      );
      if (!rotated) {
        clearRefreshCookie(reply);
        return reply.code(401).send({ error: 'Session expired' });
      }

      const user = await getUserById(rotated.userId);
      if (!user) {
        clearRefreshCookie(reply);
        return reply.code(401).send({ error: 'Session expired' });
      }

      setRefreshCookie(reply, rotated.newRawToken);
      return reply.send(await buildAuthSuccess(server, user));
    }
  );

  server.post('/auth/logout', async (request, reply) => {
    const rawToken = request.cookies[CONFIG.auth.refreshCookieName];
    if (rawToken) {
      await revokeRefreshTokenByRawValue(rawToken);
    }
    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  server.get(
    '/auth/me',
    { onRequest: [server.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.sub);
      if (!user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      return reply.send(user);
    }
  );

  // Advisory only: the UNIQUE constraint decides at insert time (TOCTOU)
  server.get(
    '/auth/username-available',
    { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { username } = request.query as { username?: string };
      const parsed = usernameSchema.safeParse(username ?? '');

      if (!parsed.success) {
        const response: UsernameAvailabilityDTO = {
          available: false,
          reason: parsed.error.issues[0]?.message,
        };
        return reply.send(response);
      }

      const existing = await getUserByUsername(parsed.data);
      const response: UsernameAvailabilityDTO = { available: !existing };
      return reply.send(response);
    }
  );
}
