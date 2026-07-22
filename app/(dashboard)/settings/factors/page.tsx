'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useMutation } from '@/hooks/use-mutation';
import { FactorRow, FactorItem } from '@/components/ui/factor-row';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, Plus, Search, ShieldCheck, UserCheck, CornerUpRight, RotateCcw, Sliders } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

interface CustomFactor {
  id: string;
  category: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  value: number;
  unit: string;
  source?: string | null;
}

interface SystemFactor {
  id: string;
  category: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  value: number;
  unit: string;
  source?: string | null;
}

export default function FactorsSettingsPage() {
  const { data: customFactors, isLoading: loadingCustom, error: errorCustom, refetch: refetchCustom } = useApi<CustomFactor[]>('/api/factors');
  const { data: systemFactors, isLoading: loadingSystem, error: errorSystem } = useApi<SystemFactor[]>('/api/system-factors');
  const { toast } = useToast();

  const [category, setCategory] = React.useState('');
  const [scope, setScope] = React.useState<'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'>('SCOPE_1');
  const [value, setValue] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [source, setSource] = React.useState('');
  const [editingFactorId, setEditingFactorId] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [scopeFilter, setScopeFilter] = React.useState<string>('ALL');

  // Confirm dialog state for delete
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [factorToDelete, setFactorToDelete] = React.useState<{ id: string; category: string } | null>(null);

  const formRef = React.useRef<HTMLDivElement>(null);

  const { mutate: saveFactor, isLoading: isSaving } = useMutation({
    url: '/api/factors',
    method: 'POST',
    onSuccess: () => {
      toast.success(
        editingFactorId ? 'Factor Updated' : 'Factor Saved',
        editingFactorId ? 'Custom emission factor was successfully updated.' : 'Custom emission factor was successfully recorded.'
      );
      resetForm();
      refetchCustom();
    },
    onError: (err) => {
      toast.error('Failed to save factor', err || 'Something went wrong.');
    },
  });

  const [isDeleting, setIsDeleting] = React.useState(false);

  const resetForm = () => {
    setCategory('');
    setScope('SCOPE_1');
    setValue('');
    setUnit('');
    setSource('');
    setEditingFactorId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !value || !unit) {
      toast.error('Validation Error', 'Please fill in category, value, and unit fields.');
      return;
    }
    saveFactor({
      category: category.trim(),
      scope,
      value: Number(value),
      unit: unit.trim(),
      source: source.trim() || undefined,
    });
  };

  const handleEdit = (factor: FactorItem) => {
    setEditingFactorId(factor.id);
    setCategory(factor.category);
    setScope(factor.scope);
    setValue(String(factor.value));
    setUnit(factor.unit);
    setSource(factor.source || '');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOverride = (factor: FactorItem) => {
    setEditingFactorId(factor.isCustom ? factor.id : null);
    setCategory(factor.category);
    setScope(factor.scope);
    setValue(String(factor.value));
    setUnit(factor.unit);
    setSource(factor.source ? `Override based on ${factor.source}` : 'Custom Override');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string, categoryName: string) => {
    setFactorToDelete({ id, category: categoryName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!factorToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/factors?id=${factorToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Factor Deleted', `Custom factor for "${factorToDelete.category}" was removed.`);
        setDeleteDialogOpen(false);
        setFactorToDelete(null);
        refetchCustom();
      } else {
        toast.error('Failed to delete factor', data.error || 'Failed to delete factor');
      }
    } catch (err: any) {
      toast.error('Failed to delete factor', err?.message || 'Network error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Map custom factors by category for fast override lookup
  const customFactorMap = React.useMemo(() => {
    const map = new Map<string, CustomFactor>();
    if (customFactors) {
      customFactors.forEach((f) => map.set(f.category.toLowerCase(), f));
    }
    return map;
  }, [customFactors]);

  // Combined list of factors for display
  const { allFactorItems, customFactorItems, systemFactorItems } = React.useMemo(() => {
    const customItems: FactorItem[] = (customFactors || []).map((f) => ({
      ...f,
      isCustom: true,
      isOverridden: false,
    }));

    const systemItems: FactorItem[] = (systemFactors || []).map((sf) => {
      const override = customFactorMap.get(sf.category.toLowerCase());
      return {
        ...sf,
        isCustom: false,
        isOverridden: Boolean(override),
        overrideFactor: override ? { ...override, isCustom: true } : undefined,
      };
    });

    // Combined all items: Custom factors + System factors that are NOT overridden (or system factors with override info)
    const allItems: FactorItem[] = [...customItems];
    
    // Add system factors if they aren't already represented as custom factor category
    systemItems.forEach((sf) => {
      if (!customFactorMap.has(sf.category.toLowerCase())) {
        allItems.push(sf);
      }
    });

    // Sort by category
    allItems.sort((a, b) => a.category.localeCompare(b.category));

    return {
      allFactorItems: allItems,
      customFactorItems: customItems,
      systemFactorItems: systemItems,
    };
  }, [customFactors, systemFactors, customFactorMap]);

  // Filter helper
  const filterFactors = (items: FactorItem[]) => {
    return items.filter((item) => {
      const matchesSearch =
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.unit.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesScope = scopeFilter === 'ALL' || item.scope === scopeFilter;

      return matchesSearch && matchesScope;
    });
  };

  const filteredAll = filterFactors(allFactorItems);
  const filteredCustom = filterFactors(customFactorItems);
  const filteredSystem = filterFactors(systemFactorItems);

  const overriddenCount = systemFactorItems.filter((s) => s.isOverridden).length;
  const isLoading = loadingCustom || loadingSystem;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Sliders className="h-6 w-6 text-primary" />
          Emission Factors Management
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure custom carbon intensity factors for your organization. User-defined custom factors automatically override standard system factors during emission calculations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Standard System Factors</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{systemFactors?.length ?? 0}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Custom User Factors</p>
              <p className="text-2xl font-bold text-primary mt-0.5">{customFactors?.length ?? 0}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Overrides</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{overriddenCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CornerUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Form Column */}
        <Card className="md:col-span-1 h-fit" ref={formRef}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {editingFactorId ? (
                <>
                  <RotateCcw className="h-5 w-5 text-primary" />
                  Edit Custom Factor
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Add Custom / Override Factor
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {editingFactorId
                ? 'Update an existing custom emission factor.'
                : 'Enter a custom factor. Matching a system category key will override it.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="factor-category">Category Key *</Label>
                <Input
                  id="factor-category"
                  placeholder="e.g. diesel, electricity_UK-grid"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={Boolean(editingFactorId)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {editingFactorId
                    ? 'Category key cannot be changed in edit mode. Delete and re-create if you need a different key.'
                    : 'Use exact category name to override a standard system factor.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-scope">Emission Scope *</Label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3')}
                >
                  <SelectTrigger id="factor-scope">
                    <SelectValue placeholder="Select Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCOPE_1">Scope 1 (Direct Emissions)</SelectItem>
                    <SelectItem value="SCOPE_2">Scope 2 (Indirect Energy)</SelectItem>
                    <SelectItem value="SCOPE_3">Scope 3 (Value Chain)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-value">CO₂e Value (kg per unit) *</Label>
                <Input
                  id="factor-value"
                  type="number"
                  step="0.000001"
                  placeholder="e.g. 2.68"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-unit">Unit *</Label>
                <Input
                  id="factor-unit"
                  placeholder="e.g. kgCO2e/litre, kWh, tonne-km"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="factor-source">Data Source / Citation</Label>
                <Input
                  id="factor-source"
                  placeholder="e.g. PPA Contract 2026, DEFRA 2024"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving
                    ? 'Saving...'
                    : editingFactorId
                    ? 'Update Factor'
                    : 'Save Factor'}
                </Button>
                {editingFactorId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Listing Column */}
        <div className="md:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by category, unit, or source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger className="w-full sm:w-[160px] text-sm">
                <SelectValue placeholder="All Scopes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Scopes</SelectItem>
                <SelectItem value="SCOPE_1">Scope 1</SelectItem>
                <SelectItem value="SCOPE_2">Scope 2</SelectItem>
                <SelectItem value="SCOPE_3">Scope 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Factors ({filteredAll.length})
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom Factors ({filteredCustom.length})
              </TabsTrigger>
              <TabsTrigger value="system">
                System Factors ({filteredSystem.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: All Factors */}
            <TabsContent value="all" className="space-y-3">
              {(errorCustom || errorSystem) ? (
                <Card>
                  <CardContent className="flex items-center gap-3 py-4 text-destructive" role="alert">
                    <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm">{errorCustom || errorSystem}</p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : filteredAll.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card text-center text-muted-foreground">
                  No emission factors found matching your search.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAll.map((factor) => (
                    <FactorRow
                      key={`${factor.isCustom ? 'custom' : 'system'}-${factor.id}`}
                      factor={factor}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onOverride={handleOverride}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: Custom Factors */}
            <TabsContent value="custom" className="space-y-3">
              {loadingCustom ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : filteredCustom.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card text-center text-muted-foreground space-y-2">
                  <UserCheck className="h-8 w-8 text-muted-foreground/50" />
                  <p className="font-medium text-sm">No custom factors defined</p>
                  <p className="text-xs">Use the form on the left to add your organization&apos;s custom emission factors or overrides.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustom.map((factor) => (
                    <FactorRow
                      key={`custom-${factor.id}`}
                      factor={factor}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: System Factors */}
            <TabsContent value="system" className="space-y-3">
              {loadingSystem ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : filteredSystem.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-card text-center text-muted-foreground">
                  No system emission factors found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSystem.map((factor) => (
                    <FactorRow
                      key={`system-${factor.id}`}
                      factor={factor}
                      onOverride={handleOverride}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Custom Emission Factor"
        description={`Are you sure you want to delete the custom factor for "${factorToDelete?.category}"? This will cause future calculations to revert to the standard system factor.`}
        confirmLabel="Delete Factor"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
