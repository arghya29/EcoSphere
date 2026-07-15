'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useMutation } from '@/hooks/use-mutation';
import { TargetCard } from '@/components/ui/target-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, Target as TargetIcon, Plus } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

interface TargetRecord {
  id: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  targetValue: number;
  currentValue: number;
  year: number;
}

export default function TargetsPage() {
  const { data: targets, isLoading, error, refetch } = useApi<TargetRecord[]>('/api/targets');
  const { toast } = useToast();

  const [scope, setScope] = React.useState<'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'>('SCOPE_1');
  const [year, setYear] = React.useState<number>(new Date().getFullYear());
  const [targetValue, setTargetValue] = React.useState<string>('');

  const { mutate, isLoading: isSaving } = useMutation({
    url: '/api/targets',
    method: 'POST',
    onSuccess: () => {
      toast.success('Target Saved', `Carbon target successfully updated for ${year}`);
      setTargetValue('');
      refetch();
    },
    onError: (err) => {
      toast.error('Failed to save target', err || 'Something went wrong.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetValue === '' || isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
      toast.error('Validation Error', 'Please enter a valid numeric target value greater than 0');
      return;
    }
    mutate({
      scope,
      year: Number(year),
      targetValue: Number(targetValue),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold">Emission Targets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Define and track your carbon reduction targets across Scopes 1, 2, and 3.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TargetIcon className="h-5 w-5 text-primary" />
              Set Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="target-scope">Emission Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3')}
                >
                  <SelectTrigger id="target-scope">
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCOPE_1">Scope 1 (Direct)</SelectItem>
                    <SelectItem value="SCOPE_2">Scope 2 (Indirect Grid)</SelectItem>
                    <SelectItem value="SCOPE_3">Scope 3 (Supply Chain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target-year">Target Year</Label>
                <Input
                  id="target-year"
                  type="number"
                  min={2020}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target-value">Target Emissions Limit (kg CO₂e)</Label>
                <Input
                  id="target-value"
                  type="number"
                  placeholder="e.g. 50000"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? 'Saving...' : 'Save Target'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-foreground">Current Targets</h2>
          {error ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !targets || targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card text-center">
              <TargetIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No targets configured yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {targets.map((t) => (
                <TargetCard
                  key={t.id}
                  scope={t.scope}
                  targetValue={t.targetValue}
                  currentValue={t.currentValue}
                  year={t.year}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
