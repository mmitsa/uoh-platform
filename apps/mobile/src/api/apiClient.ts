import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5062';
const TOKEN_KEY = 'uoh_auth_token';
const RETRY_CODES = [408, 429, 502, 503, 504];
const MAX_RETRIES = 2;
const TIMEOUT_MS = 30000;

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`API ${status}: ${body}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }

  get isNotFound() { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isServerError() { return this.status >= 500; }
}

let _cachedToken: string | null = null;

export function isDemoMode(): boolean {
  return _cachedToken?.startsWith('demo-token-') ?? false;
}

export async function getToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;
  try {
    _cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch { /* ignore */ }
  return _cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  _cachedToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit, retriesLeft = MAX_RETRIES): Promise<T> {
  const token = await getToken();

  if (token?.startsWith('demo-token-')) {
    const { getDemoResponse } = await import('./demoData');
    const method = init?.method ?? 'GET';
    await new Promise(r => setTimeout(r, method === 'GET' ? 200 : 300));
    const demo = getDemoResponse(method, path);
    if (demo !== null) return demo as T;
    throw new Error('DEMO_NOT_SUPPORTED');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      if (retriesLeft > 0 && RETRY_CODES.includes(res.status)) {
        await new Promise(r => setTimeout(r, (MAX_RETRIES - retriesLeft + 1) * 1000));
        return apiFetch<T>(path, init, retriesLeft - 1);
      }
      const body = await res.text().catch(() => '');
      throw new ApiError(res.status, res.statusText, body);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
