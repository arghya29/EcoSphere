'use client';

import * as React from 'react';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApi<T>(url: string): ApiState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? `Request to ${url} failed`);
        }
        return json.data as T;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, version]);

  const refetch = React.useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, isLoading, refetch };
}
