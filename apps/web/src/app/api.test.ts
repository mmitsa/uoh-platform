import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError, apiFetch } from './api'

// ---------------------------------------------------------------------------
// ApiError unit tests
// ---------------------------------------------------------------------------

describe('ApiError', () => {
  it('sets status, statusText, body, and details', () => {
    const details = { field: 'email', message: 'invalid' }
    const err = new ApiError(400, 'Bad Request', '{"field":"email"}', details)

    expect(err.status).toBe(400)
    expect(err.statusText).toBe('Bad Request')
    expect(err.body).toBe('{"field":"email"}')
    expect(err.details).toEqual(details)
    expect(err.name).toBe('ApiError')
    expect(err.message).toBe('API_ERROR_400: Bad Request')
  })

  it('works without details', () => {
    const err = new ApiError(500, 'Internal Server Error', 'boom')
    expect(err.details).toBeUndefined()
  })

  it.each([
    ['isNotFound', 404, true],
    ['isNotFound', 400, false],
    ['isValidation', 400, true],
    ['isValidation', 404, false],
    ['isUnauthorized', 401, true],
    ['isUnauthorized', 200, false],
    ['isForbidden', 403, true],
    ['isForbidden', 401, false],
    ['isConflict', 409, true],
    ['isConflict', 400, false],
    ['isServerError', 500, true],
    ['isServerError', 502, true],
    ['isServerError', 499, false],
  ] as const)('%s returns %s for status %i', (getter, status, expected) => {
    const err = new ApiError(status, 'test', '')
    expect(err[getter]).toBe(expected)
  })

  it('is an instance of Error', () => {
    const err = new ApiError(404, 'Not Found', '')
    expect(err).toBeInstanceOf(Error)
  })
})

// ---------------------------------------------------------------------------
// apiFetch tests
// ---------------------------------------------------------------------------

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

  it('makes a successful JSON request', async () => {
    const mockData = { id: 1, name: 'Test' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockData),
    })

    const result = await apiFetch<typeof mockData>('/items')

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns undefined for non-JSON responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
    })

    const result = await apiFetch('/health')

    expect(result).toBeUndefined()
  })

  it('throws ApiError for non-retryable error status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('not found'),
    })

    await expect(apiFetch('/missing')).rejects.toThrow(ApiError)
    // Should NOT retry for 404
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on retryable status codes (429, 502, 503, 504, 408)', async () => {
    const successData = { ok: true }

    // First two calls return 503, third succeeds
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('unavailable'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('unavailable'),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(successData),
      })

    const result = await apiFetch('/flaky')

    expect(result).toEqual(successData)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting retries on retryable status', async () => {
    // All 3 attempts (initial + 2 retries) return 503
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: () => Promise.resolve('unavailable'),
    })

    await expect(apiFetch('/broken')).rejects.toThrow(ApiError)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('parses JSON details from error response body', async () => {
    const errorBody = { errors: [{ field: 'name', message: 'required' }] }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: () => Promise.resolve(JSON.stringify(errorBody)),
    })

    try {
      await apiFetch('/items')
      expect.fail('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(400)
      expect(apiErr.details).toEqual(errorBody)
    }
  })

  it('retries on network errors', async () => {
    const successData = { recovered: true }

    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(successData),
      })

    const result = await apiFetch('/flaky-network')

    expect(result).toEqual(successData)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})
