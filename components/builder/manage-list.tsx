'use client';

import * as React from 'react';
import { Trash2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

export function ManageList<T extends { id: string }>({
  title,
  noun,
  emptyText,
  items,
  describe,
  deleteUrl,
  onDeleted,
}: {
  title: string;
  noun: string;
  emptyText: string;
  items: T[];
  describe: (item: T) => string;
  deleteUrl: (item: T) => string;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState<T | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const closeDialog = () => {
    if (isDeleting) return;
    setPending(null);
    setError(null);
  };

  const confirmRemove = async () => {
    if (!pending) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(deleteUrl(pending), { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        const message = json.error ?? `Could not remove this ${noun}.`;
        setError(message);
        toast.error(`Could not remove ${noun}`, message);
        return;
      }
      toast.success(`${noun.charAt(0).toUpperCase()}${noun.slice(1)} removed`, describe(pending));
      setPending(null);
      setError(null);
      onDeleted();
    } catch {
      const message = 'Something went wrong. Please try again.';
      setError(message);
      toast.error(`Could not remove ${noun}`, message);
    } finally {
      setIsDeleting(false);
    }
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

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {noun}?</DialogTitle>
            <DialogDescription>
              {pending ? `"${describe(pending)}" will be removed. This can't be undone.` : ''}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmRemove} disabled={isDeleting}>
              {isDeleting ? 'Removing\u2026' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
