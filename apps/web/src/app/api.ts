export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, statusText: string, body: string, details?: Record<string, unknown>) {
    super(`API_ERROR_${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.details = details;
  }

  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 400;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isServerError() {
    return this.status >= 500;
  }
}

const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);
const MAX_RETRIES = 2;
const TIMEOUT_MS = 30_000;

function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('uoh_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const token = getStoredToken();
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && !token.startsWith('demo-token-')) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${input}`, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          ...authHeaders,
          ...(init?.headers as Record<string, string> ?? {}),
        },
      });

      if (!res.ok) {
        const text = await res.text();
        let details: Record<string, unknown> | undefined;
        try {
          details = JSON.parse(text);
        } catch {
          /* not JSON */
        }

        const error = new ApiError(res.status, res.statusText, text, details);

        if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
          lastError = error;
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw error;
      }

      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return (await res.json()) as T;
      }
      return undefined as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new ApiError(0, 'Request Timeout', 'Request timed out');
      }
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}
