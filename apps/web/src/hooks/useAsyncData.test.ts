import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {})) // never resolves

    const { result } = renderHook(() => useAsyncData(fetcher))

    expect(result.current.status).toBe('loading')
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeUndefined()
  })

  it('transitions to success state with data', async () => {
    const mockData = { id: 1, name: 'Test Item' }
    const fetcher = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useAsyncData(fetcher))

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeUndefined()
  })

  it('transitions to error state when fetcher throws', async () => {
    const testError = new Error('Fetch failed')
    const fetcher = vi.fn().mockRejectedValue(testError)

    const { result } = renderHook(() => useAsyncData(fetcher))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toEqual(testError)
  })

  it('wraps non-Error thrown values in an Error', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error')

    const { result } = renderHook(() => useAsyncData(fetcher))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('string error')
  })

  it('refetch re-runs the fetcher and updates state', async () => {
    let callCount = 0
    const fetcher = vi.fn(async () => {
      callCount++
      return { count: callCount }
    })

    const { result } = renderHook(() => useAsyncData(fetcher))

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.data).toEqual({ count: 1 })

    // Trigger refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.data).toEqual({ count: 2 })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('refetch transitions through loading state', async () => {
    let resolveSecondCall: ((value: string) => void) | undefined
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(
        () => new Promise<string>((resolve) => { resolveSecondCall = resolve }),
      )

    const { result } = renderHook(() => useAsyncData(fetcher))

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    // Start refetch (will hang on the second call)
    act(() => {
      void result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    // Resolve the second call
    await act(async () => {
      resolveSecondCall!('second')
    })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
    expect(result.current.data).toBe('second')
  })

  it('re-fetches when deps change', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useAsyncData(() => fetcher(id), [id]),
      { initialProps: { id: 1 } },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    expect(fetcher).toHaveBeenCalledWith(1)

    // Change the dependency
    rerender({ id: 2 })

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(2)
    })

    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
