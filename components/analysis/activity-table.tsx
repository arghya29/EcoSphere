'use client';

import * as React from 'react';
import { formatKg } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

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
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} activities?`)) return;

    try {
      const res = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Deleted', 'Selected activities deleted successfully.');
        setSelectedIds([]);
        fetchActivities();
      } else {
        toast.error('Error', json.error || 'Failed to delete activities.');
      }
    } catch {
      toast.error('Error', 'Failed to delete activities.');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map((a) => a.id));
    }
  };

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
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="ml-auto flex items-center gap-1.5">
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={activities.length > 0 && selectedIds.length === activities.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all activities"
                />
              </th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Factor Category</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Emissions</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading activities...
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No activities found.
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(act.id)}
                      onChange={() => toggleSelect(act.id)}
                      aria-label={`Select activity ${act.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{act.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{act.factor?.category}</td>
                  <td className="px-4 py-3">
                    {act.amount} {act.unit}
                  </td>
                  <td className="px-4 py-3 font-mono">{formatKg(act.emissionsKg)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(act.dateRecorded).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            disabled={offset + limit >= total || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
