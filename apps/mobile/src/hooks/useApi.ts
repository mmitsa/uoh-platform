import { useCallback } from 'react';
import { api } from '../api/apiClient';

export function useApi() {
  const get = useCallback(<T>(path: string) => api.get<T>(path), []);
  const post = useCallback(<T>(path: string, body?: unknown) => api.post<T>(path, body), []);
  const put = useCallback(<T>(path: string, body?: unknown) => api.put<T>(path, body), []);
  const del = useCallback(<T>(path: string) => api.del<T>(path), []);

  return { get, post, put, del };
}
