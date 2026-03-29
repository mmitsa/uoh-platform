import { useCallback } from 'react';
import { apiFetch } from '../app/api';
import { getDemoResponse } from '../app/demoData';

function isDemoMode(): boolean {
  try {
    const raw = localStorage.getItem('uoh_auth');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === 'string' && parsed.token.startsWith('demo-token-');
  } catch {
    return false;
  }
}

export { isDemoMode };

async function demoAwareFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Demo mode: use demo data only, no real API calls
  if (isDemoMode()) {
    const method = init?.method ?? 'GET';
    const demo = getDemoResponse(method, path);
    if (demo !== null) {
      // Simulate small network delay for realism
      await new Promise(r => setTimeout(r, 200));
      return demo as T;
    }
    // For unsupported demo operations, return a success-like response
    if (method !== 'GET') {
      await new Promise(r => setTimeout(r, 300));
      return { success: true } as T;
    }
    throw new Error('DEMO_NOT_SUPPORTED');
  }

  // Production: real API only — no fallback
  return await apiFetch<T>(path, init);
}

export function useApi() {
  const get = useCallback(
    <T>(path: string, signal?: AbortSignal): Promise<T> => {
      return demoAwareFetch<T>(path, { method: 'GET', signal });
    },
    [],
  );

  const post = useCallback(
    <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> => {
      return demoAwareFetch<T>(path, {
        method: 'POST',
        body: body != null ? JSON.stringify(body) : undefined,
        signal,
      });
    },
    [],
  );

  const put = useCallback(
    <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> => {
      return demoAwareFetch<T>(path, {
        method: 'PUT',
        body: body != null ? JSON.stringify(body) : undefined,
        signal,
      });
    },
    [],
  );

  const patch = useCallback(
    <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> => {
      return demoAwareFetch<T>(path, {
        method: 'PATCH',
        body: body != null ? JSON.stringify(body) : undefined,
        signal,
      });
    },
    [],
  );

  const del = useCallback(
    <T>(path: string, signal?: AbortSignal): Promise<T> => {
      return demoAwareFetch<T>(path, { method: 'DELETE', signal });
    },
    [],
  );

  return { get, post, put, patch, del };
}
