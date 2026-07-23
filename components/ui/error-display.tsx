import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ErrorDisplay({
  title = 'Something went wrong',
  description = 'An unexpected error occurred.',
  error,
  digest,
  onRetry,
  showHomeLink = true,
}: {
  title?: string;
  description?: string;
  error?: Error | null;
  digest?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="max-w-md text-center" role="alert">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {digest && <p className="mt-3 text-xs text-muted-foreground">Error reference: {digest}</p>}
        {error && process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-left font-mono-data text-xs text-muted-foreground">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
          )}
          {showHomeLink && (
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to home
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
