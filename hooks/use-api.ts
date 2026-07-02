'use client';

import * as React from 'react';
import type { ApiResponse } from '@/types/api';

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

interface UseApiOptions {
  retries?: number;
  retryDelay?: number;
}

const defaultOptions: Required<UseApiOptions> = {
  retries: 2,
  retryDelay: 1000,
};

class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function shouldRetry(error: unknown): boolean {
  if (!(error instanceof HttpError)) return true;
  return error.status === 429 || error.status >= 500;
}

export function useApi<T>(
  url: string,
  options?: UseApiOptions
): ApiState<T> {
  const { retries, retryDelay } = { ...defaultOptions, ...options };
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;
    let attempt = 0;

    const fetchWithRetry = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        while (attempt <= retries && !cancelled) {
          try {
            const res = await fetch(url, { signal: abortController.signal });
            const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
            if (!res.ok || !json.success) {
              throw new HttpError(json.error ?? `Request to ${url} failed`, res.status);
            }
            if (!cancelled) setData(json.data as T);
            return;
          } catch (e) {
            if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return;
            attempt++;
            if (attempt > retries || !shouldRetry(e)) {
              if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
              return;
            }
            if (!cancelled) await new Promise((r) => setTimeout(r, retryDelay * 2 ** (attempt - 1)));
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchWithRetry();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [url, version, retries, retryDelay]);

  const refetch = React.useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, isLoading, refetch };
}
