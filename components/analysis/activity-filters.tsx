'use client';

import * as React from 'react';
import { Filter, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { useDebounce } from '@/hooks/use-debounce';
import type { ActivityRecord } from '@/types/api';

interface ActivityFiltersProps {
  type: string;
  onTypeChange: (type: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  search: string;
  onSearchChange: (query: string) => void;
  onExport: () => void;
  hasData: boolean;
  isExporting: boolean;
}

export function ActivityFilters({
  type,
  onTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  search,
  onSearchChange,
  onExport,
  hasData,
  isExporting,
}: ActivityFiltersProps) {
  const debouncedSearch = useDebounce(search, 250);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search activities..."
        label="Search activities"
        className="w-44 sm:w-56"
      />

      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
        aria-label="Activity type filter"
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
        onChange={(e) => onStartDateChange(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
        aria-label="Start date"
      />

      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
        aria-label="End date"
      />

      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!hasData || isExporting}
          aria-label="Export filtered activities as CSV"
        >
          <Download className="h-4 w-4 mr-1" aria-hidden="true" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  );
}
