import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from 'next-intl';

export default function NotFound() {
  const locale = useLocale();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold font-display text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href={`/${locale}/dashboard`}>Back to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}`}>Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
