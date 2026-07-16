import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';

/**
 * Resolves the API base URL:
 * 1. EXPO_PUBLIC_API_URL (set for production/APK builds)
 * 2. In dev, the machine running Metro also runs the backend, so derive
 *    its LAN IP from the Metro host — works on real devices and emulators.
 * 3. localhost fallback (web).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:4000`;

  return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let onUnauthorized: (() => void) | null = null;

/** AuthContext registers a callback so a 401 anywhere logs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from an API error response. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string; details?: { field: string; message: string }[] } }
      | undefined;
    if (data?.error?.details?.length) {
      return data.error.details.map((d) => d.message).join('\n');
    }
    if (data?.error?.message) return data.error.message;
    if (error.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
    if (!error.response) return 'Cannot reach the server. Check your connection.';
  }
  return 'Something went wrong. Please try again.';
}
