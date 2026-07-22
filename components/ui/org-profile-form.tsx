'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/components/ui/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkeletonCard } from '@/components/ui/skeleton';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface OrgProfile {
  id: string;
  name: string;
  region: string | null;
  createdAt: string;
}

export function OrgProfileForm() {
  const { data: org, isLoading, error, refetch } = useApi<OrgProfile>('/api/org');
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [initialised, setInitialised] = React.useState(false);

  React.useEffect(() => {
    if (org && !initialised) {
      setName(org.name);
      setRegion(org.region ?? '');
      setInitialised(true);
    }
  }, [org, initialised]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Validation Error', 'Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), region: region.trim() || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Profile Updated', 'Organization profile saved successfully');
        refetch();
      } else {
        toast.error('Save Failed', json.error ?? 'Something went wrong');
      }
    } catch {
      toast.error('Save Failed', 'Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <SkeletonCard />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const hasChanges = name !== (org?.name ?? '') || region !== (org?.region ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Organization Profile</CardTitle>
        <CardDescription>Name and region shown on reports and dashboards.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Organization"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-region">Region</Label>
            <Input
              id="org-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. UK, EU, US, APAC"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-fit sm:col-span-2"
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
