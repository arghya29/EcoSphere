import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { Ship } from 'lucide-react';

// useSearchParams() (used inside LoginForm to read ?callbackUrl=...) requires
// a Suspense boundary during Next.js's static build/prerender step, or the
// production build fails. Keeping this page itself a server component and
// wrapping the interactive form in Suspense satisfies that requirement.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-foreground"
          >
            <Ship className="h-5 w-5" aria-hidden="true" />
            EcoSphere
          </Link>
          <CardTitle className="text-base text-foreground">Log in to your workspace</CardTitle>
          <CardDescription>Demo login: demo@ecosphere.dev / EcoSphereDemo123!</CardDescription>
        </CardHeader>
        <React.Suspense
          fallback={
            <div className="px-5 pb-5 text-center text-sm text-muted-foreground">Loading…</div>
          }
        >
          <LoginForm />
        </React.Suspense>
      </Card>
    </div>
  );
}
