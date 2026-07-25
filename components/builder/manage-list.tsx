'use client';

import * as React from 'react';
import { Trash2, Database, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchInput } from '@/components/ui/search-input';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/components/ui/ToastProvider';
import { useMutation } from '@/hooks/use-mutation';

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
  bulkDeleteUrl,
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
  /** When provided, checkboxes and the bulk-delete action bar are enabled. */
  bulkDeleteUrl?: string;
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

  // ── Single-delete state ──────────────────────────────────────────────────
  const [pending, setPending] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // ── Bulk-select / bulk-delete state ─────────────────────────────────────
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  // Clear selection only when the underlying items list changes (e.g. after a
  // refetch), NOT when the search query changes — that would silently drop a
  // user's selection just because they refined the search.
  const itemIds = items.map((i) => i.id).join(',');
  React.useEffect(() => {
    setSelected(new Set());
  }, [itemIds]);

  // ── Checkbox helpers ─────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && selected.size < filtered.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Single-delete handlers ───────────────────────────────────────────────
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
        // Remove the deleted item from the bulk-selection set so the action bar
        // count stays accurate without waiting for the parent refetch.
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(pending.id);
          return next;
        });
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

  // ── Bulk-delete handlers ─────────────────────────────────────────────────
  const openBulkConfirm = () => {
    setBulkError(null);
    setIsBulkConfirmOpen(true);
  };

  const closeBulkDialog = () => {
    if (isBulkDeleting) return;
    setIsBulkConfirmOpen(false);
    setBulkError(null);
  };

  const confirmBulkRemove = async () => {
    if (!bulkDeleteUrl || selected.size === 0) return;
    setIsBulkDeleting(true);
    setBulkError(null);
    try {
      const res = await fetch(bulkDeleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        const message = json.error ?? `Could not delete the selected ${noun}s.`;
        setBulkError(message);
        toast.error(`Bulk delete failed`, message);
        return;
      }
      const count = json.data?.deleted ?? selected.size;
      const nounPlural = count === 1 ? noun : `${noun}s`;
      toast.success(`${count} ${nounPlural} deleted`);
      // Eagerly clear selection so the sticky action bar disappears immediately
      // and doesn't show a stale count while the parent refetch is in-flight.
      setSelected(new Set());
      setIsBulkConfirmOpen(false);
      setBulkError(null);
      onDeleted();
    } catch {
      const message = 'Something went wrong. Please try again.';
      setBulkError(message);
      toast.error('Bulk delete failed', message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const nounPlural = `${noun}s`;
  const bulkConfirmDescription =
    selected.size === 1
      ? `1 ${noun} will be permanently deleted. This can't be undone.`
      : `${selected.size} ${nounPlural} will be permanently deleted. This can't be undone.`;

  const isBulkMode = Boolean(bulkDeleteUrl);

  return (
    <>
      <Card className="relative flex flex-col">
        <CardHeader>
          <CardTitle className="text-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
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
            <div className="flex flex-col gap-0">
              {/* ── Select-all header row ── */}
              {isBulkMode && (
                <div className="flex items-center gap-3 border-b border-border pb-2 mb-1">
                  <SelectAllCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleAll}
                    label="Select all"
                  />
                  <span className="text-xs text-muted-foreground select-none">Select all</span>
                </div>
              )}

              {/* ── Item rows ── */}
              <ul className="flex flex-col divide-y divide-border">
                {filtered.map((item) => {
                  const isChecked = selected.has(item.id);
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center gap-3 py-2.5 transition-colors ${isChecked ? 'bg-primary/5 rounded-md px-1' : ''}`}
                    >
                      {isBulkMode && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(item.id)}
                          aria-label={`Select ${noun} ${describe(item)}`}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-primary rounded border-border"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {describe(item)}
                      </span>
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
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>

        {/* ── Sticky bulk-action bar ── */}
        {isBulkMode && selected.size > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 rounded-b-xl border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">
                {selected.size} {selected.size === 1 ? noun : nounPlural} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Clear
              </button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={openBulkConfirm}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {selected.size === 1 ? `1 ${noun}` : `${selected.size} ${nounPlural}`}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Single-delete confirm dialog ── */}
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

      {/* ── Bulk-delete confirm dialog ── */}
      {isBulkMode && (
        <ConfirmDialog
          isOpen={isBulkConfirmOpen}
          onOpenChange={(open) => {
            if (!open) closeBulkDialog();
          }}
          title={
            selected.size === 1 ? `Delete 1 ${noun}?` : `Delete ${selected.size} ${nounPlural}?`
          }
          description={bulkConfirmDescription}
          confirmLabel={`Delete ${selected.size === 1 ? `1 ${noun}` : `${selected.size} ${nounPlural}`}`}
          cancelLabel="Cancel"
          onConfirm={confirmBulkRemove}
          isLoading={isBulkDeleting}
          variant="danger"
        >
          {bulkError && <p className="mt-3 text-sm text-destructive">{bulkError}</p>}
        </ConfirmDialog>
      )}
    </>
  );
}

// ── Internal helper: "select all" checkbox with indeterminate support ────────
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 shrink-0 cursor-pointer accent-primary rounded border-border"
    />
  );
}
