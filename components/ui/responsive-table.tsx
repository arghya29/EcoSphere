'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Pagination, type PageSize } from '@/components/ui/Pagination';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  defaultPageSize?: PageSize;
  virtualize?: boolean;
  maxHeight?: string;
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
  virtualize = false,
  maxHeight = 'max-h-[600px]',
}: ResponsiveTableProps<T>) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState<number>(defaultPageSize);
  const desktopRef = React.useRef<HTMLDivElement>(null);
  const mobileRef = React.useRef<HTMLDivElement>(null);

  const displayData = React.useMemo(() => {
    if (!clientPagination) return data;
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
  }, [data, clientPagination, page, limit]);

  React.useEffect(() => {
    setPage(1);
  }, [data]);

  React.useEffect(() => {
    desktopRef.current?.scrollTo({ top: 0, left: 0 });
    mobileRef.current?.scrollTo({ top: 0, left: 0 });
  }, [page, limit, data]);

  const desktopVirtualizer = useVirtualizer({
    count: virtualize ? displayData.length : 0,
    getScrollElement: () => desktopRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const mobileVirtualizer = useVirtualizer({
    count: virtualize ? displayData.length : 0,
    getScrollElement: () => mobileRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

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
      <div
        ref={virtualize ? desktopRef : undefined}
        className={cn(
          'hidden sm:block overflow-auto rounded-md border bg-card relative scrollbar-thin',
          virtualize ? maxHeight : ''
        )}
      >
        <table className="w-full text-left text-sm">
          <thead
            className={cn(
              'bg-muted text-muted-foreground text-xs uppercase font-medium border-b',
              virtualize && 'sticky top-0 z-10 shadow-sm'
            )}
          >
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
            {virtualize ? (
              <>
                {desktopVirtualizer.getVirtualItems().length > 0 &&
                  desktopVirtualizer.getVirtualItems()[0]?.start > 0 && (
                    <tr>
                      <td
                        style={{ height: `${desktopVirtualizer.getVirtualItems()[0]?.start}px` }}
                        colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                      />
                    </tr>
                  )}
                {desktopVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = displayData[virtualRow.index];
                  return (
                    <tr
                      key={keyExtractor(item)}
                      data-index={virtualRow.index}
                      ref={(node) => {
                        if (node) desktopVirtualizer.measureElement(node);
                      }}
                      className="hover:bg-muted/50"
                    >
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
                  );
                })}
                {desktopVirtualizer.getVirtualItems().length > 0 &&
                  desktopVirtualizer.getTotalSize() -
                    (desktopVirtualizer.getVirtualItems()[
                      desktopVirtualizer.getVirtualItems().length - 1
                    ]?.end || 0) >
                    0 && (
                    <tr>
                      <td
                        style={{
                          height: `${desktopVirtualizer.getTotalSize() - (desktopVirtualizer.getVirtualItems()[desktopVirtualizer.getVirtualItems().length - 1]?.end || 0)}px`,
                        }}
                        colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                      />
                    </tr>
                  )}
              </>
            ) : (
              displayData.map((item) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div
        ref={virtualize ? mobileRef : undefined}
        className={cn(
          'sm:hidden',
          virtualize
            ? `overflow-auto scrollbar-thin relative ${maxHeight} flex flex-col gap-3`
            : 'space-y-3'
        )}
      >
        {virtualize ? (
          <>
            {mobileVirtualizer.getVirtualItems().length > 0 &&
              mobileVirtualizer.getVirtualItems()[0]?.start > 0 && (
                <div style={{ height: `${mobileVirtualizer.getVirtualItems()[0]?.start}px` }} />
              )}
            {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = displayData[virtualRow.index];
              return (
                <div
                  key={keyExtractor(item)}
                  data-index={virtualRow.index}
                  ref={(node) => {
                    if (node) mobileVirtualizer.measureElement(node);
                  }}
                  className="rounded-lg border bg-card p-4"
                >
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
                  {actions && (
                    <div className="mt-2 pt-2 border-t border-border">{actions(item)}</div>
                  )}
                </div>
              );
            })}
            {mobileVirtualizer.getVirtualItems().length > 0 &&
              mobileVirtualizer.getTotalSize() -
                (mobileVirtualizer.getVirtualItems()[mobileVirtualizer.getVirtualItems().length - 1]
                  ?.end || 0) >
                0 && (
                <div
                  style={{
                    height: `${mobileVirtualizer.getTotalSize() - (mobileVirtualizer.getVirtualItems()[mobileVirtualizer.getVirtualItems().length - 1]?.end || 0)}px`,
                  }}
                />
              )}
          </>
        ) : (
          displayData.map((item) => (
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
          ))
        )}
      </div>

      {clientPagination && data.length > 0 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(data.length / limit)}
          limit={limit}
          total={data.length}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      )}
    </>
  );
}
