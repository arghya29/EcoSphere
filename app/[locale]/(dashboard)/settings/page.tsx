'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrgProfileForm } from '@/components/ui/org-profile-form';
import Link from 'next/link';
import * as React from 'react';

import { usePreferences } from '@/hooks';

export default function SettingsPage() {
  const { data: session } = useSession();
  const animationsDisabled = usePreferences((state) => state.animationsDisabled);
  const setAnimationsDisabled = usePreferences((state) => state.setAnimationsDisabled);
  // Avoid hydration mismatch by only rendering after mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and organization profile.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Team Members</CardTitle>
            <CardDescription>Invite team members and configure roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/settings/members">Manage Team</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Custom Emission Factors</CardTitle>
            <CardDescription>Configure specific carbon intensity coefficients.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/settings/factors">Manage Factors</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Audit Logs</CardTitle>
            <CardDescription>View timeline of critical security actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/settings/audit">View Logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Accessibility</CardTitle>
          <CardDescription>Customize the interface for reduced motion.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-2">
          {mounted ? (
            <input
              type="checkbox"
              id="disable-animations"
              className="h-4 w-4 rounded border-border"
              checked={animationsDisabled}
              onChange={(e) => setAnimationsDisabled(e.target.checked)}
            />
          ) : (
            <div className="h-4 w-4 rounded border border-border bg-muted/50" />
          )}
          <Label htmlFor="disable-animations" className="cursor-pointer">
            Disable Animations
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Account</CardTitle>
          <CardDescription>Your personal sign-in details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input id="account-name" value={session?.user?.name ?? ''} readOnly disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" value={session?.user?.email ?? ''} readOnly disabled />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Editing account details isn&apos;t available in this build yet — it&apos;s a natural
            next addition once the MVP is live.
          </p>
        </CardContent>
      </Card>

      <OrgProfileForm />
    </div>
  );
}
