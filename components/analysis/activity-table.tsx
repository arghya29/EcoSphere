'use client';

import * as React from 'react';
import { formatKg } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { useToast } from '@/components/ui/ToastProvider';
import { Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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

export function ActivityTable() {
  const { toast } = useToast();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [total, setTotal] = React.useState(0);
  const [limit] = React.useState(10);
  const [offset, setOffset] = React.useState(0);

  const [type, setType] = React.useState('ALL');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [type, startDate, endDate, offset]);

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
  }, [limit, offset, type, startDate, endDate, toast]);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleBulkDelete = async () => {
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
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setOffset(0); }}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="ALL">All Types</option>
          <option value="FUEL">Fuel</option>
          <option value="ELECTRICITY">Electricity</option>
          <option value="FREIGHT">Freight</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          aria-label="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          aria-label="End date"
        />
        {selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="ml-auto flex items-center gap-1.5">
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      <ResponsiveTable
        columns={columns}
        data={activities}
        keyExtractor={(a) => a.id}
        loading={loading}
        emptyMessage="No activities found."
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
                const newSelections = activities.filter((a) => !prev.includes(a.id)).map((a) => a.id);
                return [...prev, ...newSelections];
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

