import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client';
import type { AuthResponse, User } from '../api/types';
import { unregisterDeviceForPush } from '../notifications/push';
import { STORAGE_KEYS, storage } from './storage';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Restore the session from secure storage on launch.
  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([
        storage.get(STORAGE_KEYS.token),
        storage.get(STORAGE_KEYS.user),
      ]);
      if (token && storedUser) {
        setAuthToken(token);
        setUser(JSON.parse(storedUser));
        setStatus('signedIn');
      } else {
        setStatus('signedOut');
      }
    })();
  }, []);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus('signedOut');
    queryClient.clear();
    await Promise.all([storage.remove(STORAGE_KEYS.token), storage.remove(STORAGE_KEYS.user)]);
  }, [queryClient]);

  // Any 401 from the API (expired/invalid token) signs the user out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const persistSession = useCallback(async ({ token, user: nextUser }: AuthResponse) => {
    setAuthToken(token);
    setUser(nextUser);
    setStatus('signedIn');
    await Promise.all([
      storage.set(STORAGE_KEYS.token, token),
      storage.set(STORAGE_KEYS.user, JSON.stringify(nextUser)),
    ]);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const { data } = await api.post('/api/auth/login', { identifier, password });
      await persistSession(data.data as AuthResponse);
    },
    [persistSession]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await api.post('/api/auth/signup', { username, email, password });
      await persistSession(data.data as AuthResponse);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    await unregisterDeviceForPush();
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ status, user, login, signup, logout }),
    [status, user, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
