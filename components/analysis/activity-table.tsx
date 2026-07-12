'use client';

import * as React from 'react';
import { formatKg } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { ActivityFilters } from '@/components/analysis/activity-filters';
import { useToast } from '@/components/ui/ToastProvider';
import { useDebounce } from '@/hooks/use-debounce';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { hasNextPage } from '@/lib/utils/pagination';

interface Activity {
  id: string;
  type: string;
  amount: number;
  unit: string;
  emissionsKg: number;
  dateRecorded: string;
  factor: {
    category: string;
    scope: string;
  };
}

function exportActivitiesAsCsv(activities: Activity[]): void {
  const headers = ['Type', 'Category', 'Amount', 'Unit', 'Emissions (kg CO2e)', 'Date'];
  const rows = activities.map((a) => [
    a.type,
    a.factor?.category ?? '',
    String(a.amount),
    a.unit,
    a.emissionsKg.toFixed(4),
    new Date(a.dateRecorded).toISOString().slice(0, 10),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `activity-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ActivityTable() {
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit] = React.useState(10);
  const [offset, setOffset] = React.useState(0);

  const [type, setType] = React.useState('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [type, startDate, endDate, debouncedSearch, offset]);

  const fetchActivities = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        type,
        startDate,
        endDate,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/activities?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setActivities(json.data.activities);
        setTotal(json.data.total);
      }
    } catch {
      toast.error('Error', 'Failed to fetch activities.');
    } finally {
      setLoading(false);
    }
  }, [limit, offset, type, startDate, endDate, debouncedSearch, toast]);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Deleted', `Successfully deleted ${selectedIds.length} activities.`);
        setSelectedIds([]);
        setShowBulkDeleteDialog(false);
        fetchActivities();
      } else {
        toast.error('Error', json.error || 'Failed to delete activities.');
      }
    } catch {
      toast.error('Error', 'Failed to delete activities.');
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportActivitiesAsCsv(activities);
      setIsExporting(false);
    }, 100);
  };

  const selectedSet = new Set(selectedIds);
  const allSelected = activities.length > 0 && activities.every((a) => selectedSet.has(a.id));

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (act: Activity) => <span className="font-medium">{act.type}</span>,
    },
    {
      key: 'category',
      header: 'Factor Category',
      render: (act: Activity) => <span className="text-muted-foreground">{act.factor?.category}</span>,
      hideOnMobile: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (act: Activity) => `${act.amount} ${act.unit}`,
    },
    {
      key: 'emissions',
      header: 'Emissions',
      render: (act: Activity) => <span className="font-mono">{formatKg(act.emissionsKg)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (act: Activity) => (
        <span className="text-muted-foreground">{new Date(act.dateRecorded).toLocaleDateString()}</span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="space-y-4">
      <ActivityFilters
        type={type}
        onTypeChange={(v) => { setType(v); setOffset(0); }}
        startDate={startDate}
        onStartDateChange={(v) => { setStartDate(v); setOffset(0); }}
        endDate={endDate}
        onEndDateChange={(v) => { setEndDate(v); setOffset(0); }}
        search={search}
        onSearchChange={setSearch}
        onExport={handleExport}
        hasData={activities.length > 0}
        isExporting={isExporting}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {selectedIds.length} activity(ies) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <ResponsiveTable
        columns={columns}
        data={activities}
        keyExtractor={(a) => a.id}
        loading={loading}
        emptyMessage={debouncedSearch ? `No activities match "${debouncedSearch}".` : 'No activities found.'}
        mobileCardTitle={(a) => `${a.type} — ${formatKg(a.emissionsKg)}`}
        selection={{
          selected: selectedSet,
          onToggle: (id) => setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
          ),
          onToggleAll: () => {
            if (allSelected) {
              setSelectedIds((prev) => prev.filter((id) => !activities.some((a) => a.id === id)));
            } else {
              setSelectedIds((prev) => {
                const ids = activities.filter((a) => !prev.includes(a.id)).map((a) => a.id);
                return [...prev, ...ids];
              });
            }
          },
          allSelected,
        }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {offset + 1} - {Math.min(offset + limit, total)} of {total} activities
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={offset === 0 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset((o) => (o + limit < total ? o + limit : o))}
            disabled={!hasNextPage(offset, limit, total) || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showBulkDeleteDialog}
        onOpenChange={(open) => { if (!open) setShowBulkDeleteDialog(false); }}
        title="Delete selected activities?"
        description={`This will permanently remove ${selectedIds.length} activity record(s). This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
      />
    </div>
  );
}

