'use client';

import * as React from 'react';
import { Trash2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchInput } from '@/components/ui/search-input';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/components/ui/ToastProvider';
import { useMutation } from '@/hooks/use-mutation';
import { Pagination } from '@/components/ui/Pagination';

const SEARCH_KEYS = ['name', 'category', 'location', 'type'] as const;

function matchesSearch<T>(item: T, query: string): boolean {
  if (!query) return true;
  const lower = query.toLowerCase();
  return SEARCH_KEYS.some((key) => {
    const val = (item as Record<string, unknown>)[key];
    return typeof val === 'string' && val.toLowerCase().includes(lower);
  });
}

export function ManageList<T extends { id: string }>({
  title,
  noun,
  emptyText,
  items,
  describe,
  deleteUrl,
  onDeleted,
  onMutate,
  onError,
  onSettled,
}: {
  title: string;
  noun: string;
  emptyText: string;
  items: T[];
  describe: (item: T) => string;
  deleteUrl: (item: T) => string;
  onDeleted: () => void;
  onMutate?: (item: T) => Promise<unknown> | unknown;
  onError?: (error: string, item: T, context: unknown) => void;
  onSettled?: (data: any, error: string | null, item: T, context: unknown) => void;
}) {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 200);
  const filtered = React.useMemo(
    () => items.filter((item) => matchesSearch(item, debouncedSearch)),
    [items, debouncedSearch]
  );
  const { toast } = useToast();
  const [pending, setPending] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  React.useEffect(() => {
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [filtered.length, limit, page]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const closeDialog = () => {
    if (isDeleting) return;
    setPending(null);
    setError(null);
  };

  const { mutate: removeEntity, isLoading: isDeleting } = useMutation({
    url: '', // We use overrideUrl parameter during execution
    method: 'DELETE',
    onMutate: async () => {
      if (pending) {
        return await onMutate?.(pending);
      }
    },
    onSuccess: () => {
      if (pending) {
        toast.success(`${noun.charAt(0).toUpperCase()}${noun.slice(1)} removed`, describe(pending));
        setPending(null);
        setError(null);
        onDeleted();
      }
    },
    onError: (errorMsg, variables, context) => {
      const message = errorMsg ?? `Could not remove this ${noun}.`;
      setError(message);
      toast.error(`Could not remove ${noun}`, message);
      if (pending) {
        onError?.(errorMsg, pending, context);
      }
    },
    onSettled: (data, errorMsg, variables, context) => {
      if (pending) {
        onSettled?.(data, errorMsg, pending, context);
      }
    },
  });

  const confirmRemove = async () => {
    if (!pending) return;
    setError(null);
    await removeEntity(undefined, deleteUrl(pending));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 4 && (
          <div className="mb-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${noun}s\u2026`}
              label={`Search ${noun}s`}
            />
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Database}
            title={search ? `No ${noun}s match "${search}"` : emptyText}
            description=""
          />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-border">
              {paginatedItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-sm text-foreground">{describe(item)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={`Remove ${noun} ${describe(item)}`}
                  onClick={() => {
                    setError(null);
                    setPending(item);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
            </ul>
            {filtered.length > limit && (
              <Pagination
                page={page}
                totalPages={Math.ceil(filtered.length / limit)}
                limit={limit}
                total={filtered.length}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
              />
            )}
          </>
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={pending !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={`Remove ${noun}?`}
        description={pending ? `"${describe(pending)}" will be removed. This can't be undone.` : ''}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={confirmRemove}
        isLoading={isDeleting}
        variant="danger"
      >
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </ConfirmDialog>
    </Card>
  );
}
