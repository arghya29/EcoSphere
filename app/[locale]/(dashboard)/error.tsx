'use client';

import { ErrorDisplay } from '@/components/ui/error-display';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ErrorDisplay
        title="Dashboard error"
        description="Something went wrong while loading this page. This may be a temporary issue with your connection or session."
        error={error}
        digest={error.digest}
        onRetry={reset}
        showHomeLink={false}
      />
    </div>
  );
}
