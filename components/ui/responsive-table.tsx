'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  mobileCardTitle?: (item: T) => string;
  selection?: {
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    allSelected: boolean;
  };
  actions?: (item: T) => React.ReactNode;
  clientPagination?: boolean;
  defaultPageSize?: number;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data found.',
  mobileCardTitle,
  selection,
  actions,
  clientPagination = false,
  defaultPageSize = 50,
}: ResponsiveTableProps<T>) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(defaultPageSize);

  const displayData = React.useMemo(() => {
    if (!clientPagination) return data;
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
  }, [data, clientPagination, page, limit]);

  React.useEffect(() => {
    setPage(1);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-3" aria-live="polite" aria-label="Loading table data">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
            <div className="mb-2 h-4 w-1/3 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed bg-card p-8 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium border-b">
            <tr>
              {selection && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selection.allSelected}
                    onChange={selection.onToggleAll}
                    aria-label="Select all items"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3', col.className)}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayData.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-muted/50">
                {selection && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selection.selected.has(keyExtractor(item))}
                      onChange={() => selection.onToggle(keyExtractor(item))}
                      aria-label={`Select ${keyExtractor(item)}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3', col.className)}>
                    {col.render(item)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {displayData.map((item) => (
          <div key={keyExtractor(item)} className="rounded-lg border bg-card p-4">
            {selection && (
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selection.selected.has(keyExtractor(item))}
                  onChange={() => selection.onToggle(keyExtractor(item))}
                  aria-label={`Select ${keyExtractor(item)}`}
                />
                {mobileCardTitle && (
                  <span className="text-sm font-semibold">{mobileCardTitle(item)}</span>
                )}
              </div>
            )}
            {!selection && mobileCardTitle && (
              <div className="mb-2 text-sm font-semibold">{mobileCardTitle(item)}</div>
            )}
            <dl className="divide-y divide-border text-sm">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex justify-between gap-2 py-1.5">
                    <dt className="text-muted-foreground shrink-0">{col.header}</dt>
                    <dd className="text-right font-medium">{col.render(item)}</dd>
                  </div>
                ))}
            </dl>
            {actions && <div className="mt-2 pt-2 border-t border-border">{actions(item)}</div>}
          </div>
        ))}
      </div>

      {clientPagination && data.length > 0 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(data.length / limit)}
          limit={limit}
          total={data.length}
          onPageChange={setPage}
          onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        />
      )}
    </>
  );
}
