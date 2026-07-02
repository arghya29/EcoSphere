'use client';

import * as React from 'react';

interface UseMutationOptions<TReq, TRes> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  onSuccess?: (data: TRes) => void;
  onError?: (error: string) => void;
}

interface UseMutationResult<TReq, TRes> {
  mutate: (body?: TReq) => Promise<TRes | null>;
  isLoading: boolean;
  error: string | null;
  data: TRes | null;
  reset: () => void;
}

export function useMutation<TReq = Record<string, unknown>, TRes = Record<string, unknown>>(
  options: UseMutationOptions<TReq, TRes>
): UseMutationResult<TReq, TRes> {
  const { url, method = 'POST', headers = {}, onSuccess, onError } = options;
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TRes | null>(null);

  const mutate = React.useCallback(
    async (body?: TReq): Promise<TRes | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          const message = json.error ?? `Request to ${url} failed`;
          setError(message);
          onError?.(message);
          return null;
        }
        const result = json.data as TRes;
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, headers, onSuccess, onError]
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, data, reset };
}
