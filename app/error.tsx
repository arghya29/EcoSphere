"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <ErrorDisplay
        title="Something went wrong"
        description="An unexpected error occurred. You can try again or go back to the home page."
        error={error}
        onRetry={reset}
        showHomeLink={true}
      />
      {error.digest && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}
