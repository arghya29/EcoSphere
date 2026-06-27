'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? '';
  const email = session?.user?.email ?? '';
  const initial = (name || email || 'A').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your personal account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Account</CardTitle>
          <CardDescription>How you appear in EcoSphere.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{name || 'Your account'}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" defaultValue={name} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" defaultValue={email} disabled />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Profile editing isn&apos;t available in this build yet. To manage your organization details,
            head to{' '}
            <Link href="/settings" className="font-medium underline underline-offset-4 hover:text-foreground">
              Settings
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
