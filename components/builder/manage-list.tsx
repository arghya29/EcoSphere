'use client';

import * as React from 'react';
import { Trash2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';
import { useMutation } from '@/hooks/use-mutation';

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
  const { toast } = useToast();
  const [pending, setPending] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
        {items.length === 0 ? (
          <EmptyState
            icon={Database}
            title={emptyText}
            description=""
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
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
