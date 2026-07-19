import type { AuthSuccessDTO } from '@chat/shared';
import { SERVER_URL } from '../config.ts';

/**
 * Access token lives in memory only (never localStorage — XSS cannot steal
 * what is not stored). The refresh token lives in an httpOnly cookie that
 * JavaScript cannot read; a page reload restores the session via
 * POST /auth/refresh.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function rawRequest(
  path: string,
  { method = 'GET', body }: RequestOptions
): Promise<Response> {
  return fetch(`${SERVER_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function throwApiError(response: Response): Promise<never> {
  let message = `Request failed (${response.status})`;
  try {
    const data = (await response.json()) as { error?: string };
    if (data?.error) message = data.error;
  } catch {
    // non-JSON error body — keep the generic message
  }
  throw new ApiError(response.status, message);
}

/** Attempts to renew the session from the refresh cookie. */
export async function tryRefreshSession(): Promise<AuthSuccessDTO | null> {
  const response = await rawRequest('/auth/refresh', { method: 'POST' });
  if (!response.ok) {
    setAccessToken(null);
    return null;
  }
  const data = (await response.json()) as AuthSuccessDTO;
  setAccessToken(data.accessToken);
  return data;
}

/**
 * JSON API call. On a 401 outside the auth endpoints it refreshes the
 * session once and retries, so a short-lived access token expiring
 * mid-session is invisible to callers.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  let response = await rawRequest(path, options);

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await rawRequest(path, options);
    }
  }

  if (!response.ok) {
    await throwApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
