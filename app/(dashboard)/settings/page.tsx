'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and organization profile.</p>
      </div>

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
            Editing account details isn&apos;t available in this build yet — it&apos;s a natural next addition once
            the MVP is live.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Organization profile</CardTitle>
          <CardDescription>Name and region shown on reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" placeholder="Your Organization" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-region">Region</Label>
            <Input id="org-region" placeholder="e.g. UK, EU, US" />
          </div>
          <Button size="sm" className="w-fit sm:col-span-2" disabled>
            Save changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
