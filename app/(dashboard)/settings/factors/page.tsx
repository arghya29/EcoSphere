'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useMutation } from '@/hooks/use-mutation';
import { FactorRow } from '@/components/ui/factor-row';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, Plus } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

interface CustomFactor {
  id: string;
  category: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  value: number;
  unit: string;
  source?: string | null;
}

export default function FactorsSettingsPage() {
  const { data: factors, isLoading, error, refetch } = useApi<CustomFactor[]>('/api/factors');
  const { toast } = useToast();

  const [category, setCategory] = React.useState('');
  const [scope, setScope] = React.useState<'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'>('SCOPE_1');
  const [value, setValue] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [source, setSource] = React.useState('');

  const { mutate: saveFactor, isLoading: isSaving } = useMutation({
    url: '/api/factors',
    method: 'POST',
    onSuccess: () => {
      toast.success('Factor Saved', 'Custom emission factor was successfully recorded.');
      setCategory('');
      setValue('');
      setUnit('');
      setSource('');
      refetch();
    },
    onError: (err) => {
      toast.error('Failed to save factor', err || 'Something went wrong.');
    },
  });

  const { mutate: deleteFactor } = useMutation({
    url: '/api/factors',
    method: 'DELETE',
    onSuccess: () => {
      toast.success('Factor Deleted', 'The custom emission factor has been removed.');
      refetch();
    },
    onError: (err) => {
      toast.error('Failed to delete factor', err || 'Something went wrong.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !value || !unit) {
      toast.error('Validation Error', 'Please fill in all required fields.');
      return;
    }
    saveFactor({
      category,
      scope,
      value: Number(value),
      unit,
      source: source || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this custom factor?')) {
      deleteFactor(null as any); // use query params or send search string
      fetch(`/api/factors?id=${id}`, { method: 'DELETE' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success('Factor Deleted', 'Factor was removed.');
            refetch();
          } else {
            toast.error('Failed to delete factor', data.error);
          }
        });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold">Custom Emission Factors</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Define custom carbon intensity coefficients for your specific supply chain activities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Custom Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="factor-category">Category Key</Label>
                <Input
                  id="factor-category"
                  placeholder="e.g. bio_diesel_b20"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-scope">Emission Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3')}
                >
                  <SelectTrigger id="factor-scope">
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
                <Label htmlFor="factor-value">CO₂e Value (kg)</Label>
                <Input
                  id="factor-value"
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 2.68"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-unit">Unit</Label>
                <Input
                  id="factor-unit"
                  placeholder="e.g. litre"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-source">Data Source Citation</Label>
                <Input
                  id="factor-source"
                  placeholder="e.g. Defra 2025"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? 'Saving...' : 'Save Factor'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-medium text-foreground">Configured Custom Factors</h2>
          {error ? (
            <Card>
              <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !factors || factors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card text-center text-muted-foreground">
              No custom factors set. Standard database factors will apply.
            </div>
          ) : (
            <div className="space-y-3">
              {factors.map((f) => (
                <FactorRow key={f.id} factor={f} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
