import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthSuccessDTO,
  LoginInput,
  RegisterInput,
  UserDTO,
} from '@chat/shared';
import {
  apiFetch,
  setAccessToken,
  tryRefreshSession,
} from '../api/http.ts';

interface AuthContextValue {
  user: UserDTO | null;
  accessToken: string | null;
  /** True while the initial session-restore attempt is in flight. */
  initializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((session: AuthSuccessDTO) => {
    setAccessToken(session.accessToken);
    setToken(session.accessToken);
    setUser(session.user);
  }, []);

  // Restore the session from the refresh cookie on page load
  useEffect(() => {
    let cancelled = false;
    tryRefreshSession()
      .then((session) => {
        if (!cancelled && session) applySession(session);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await apiFetch<AuthSuccessDTO>('/auth/login', {
        method: 'POST',
        body: input,
      });
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await apiFetch<AuthSuccessDTO>('/auth/register', {
        method: 'POST',
        body: input,
      });
      applySession(session);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, initializing, login, register, logout }),
    [user, accessToken, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
