'use client';

import * as React from 'react';
import type { ApiResponse, MutationState } from '@/types/api';

const EMPTY_HEADERS: Record<string, string> = {};

interface UseMutationOptions<TReq, TRes> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  onMutate?: (variables?: TReq) => Promise<unknown> | unknown;
  onSuccess?: (data: TRes, variables?: TReq, context?: unknown) => void;
  onError?: (error: string, variables?: TReq, context?: unknown) => void;
  onSettled?: (data: TRes | null, error: string | null, variables?: TReq, context?: unknown) => void;
}

interface UseMutationResult<TReq, TRes> extends MutationState<TRes> {
  mutate: (body?: TReq, overrideUrl?: string) => Promise<TRes | null>;
  reset: () => void;
}

export function useMutation<TReq = Record<string, unknown>, TRes = Record<string, unknown>>(
  options: UseMutationOptions<TReq, TRes>
): UseMutationResult<TReq, TRes> {
  const { url, method = 'POST', headers = EMPTY_HEADERS, onMutate, onSuccess, onError, onSettled } = options;
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<TRes | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const mountedRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const mutate = React.useCallback(
    async (body?: TReq, overrideUrl?: string): Promise<TRes | null> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let context: unknown = undefined;
      if (onMutate) {
        try {
          context = await onMutate(body);
        } catch (err) {
          console.error('Error in onMutate callback:', err);
        }
      }

      const activeUrl = overrideUrl || url;

      try {
        const res = await fetch(activeUrl, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: abortController.signal,
        });
        const json = (await res.json().catch(() => ({}))) as ApiResponse<TRes>;
        if (!res.ok || !json.success) {
          const message = json.error ?? `Request to ${activeUrl} failed`;
          if (mountedRef.current) setError(message);
          onError?.(message, body, context);
          onSettled?.(null, message, body, context);
          return null;
        }
        const result = json.data as TRes;
        if (mountedRef.current) {
          setData(result);
          setIsSuccess(true);
        }
        onSuccess?.(result, body, context);
        onSettled?.(result, null, body, context);
        return result;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return null;
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (mountedRef.current) setError(message);
        onError?.(message, body, context);
        onSettled?.(null, message, body, context);
        return null;
      } finally {
        if (abortControllerRef.current === abortController) abortControllerRef.current = null;
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [url, method, headers, onMutate, onSuccess, onError, onSettled]
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  }, []);

  return { mutate, isLoading, error, data, isSuccess, reset };
}
