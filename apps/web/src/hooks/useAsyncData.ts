import { useCallback, useEffect, useState } from 'react';

type AsyncState<T> =
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: Error };

export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: undefined,
    error: undefined,
  });

  const execute = useCallback(async () => {
    setState({ status: 'loading', data: undefined, error: undefined });
    try {
      const data = await fetcher();
      setState({ status: 'success', data, error: undefined });
    } catch (err) {
      setState({
        status: 'error',
        data: undefined,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void execute();
  }, [execute]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    refetch: execute,
  };
}
