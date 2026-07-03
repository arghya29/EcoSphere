'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  variant = 'danger',
  children,
}: ConfirmDialogProps) {
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const confirmButtonVariant = variant === 'danger' ? 'destructive' : 'default';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] border border-red-500/20 bg-background dark:bg-card">
        <DialogHeader className="flex flex-row items-center gap-3">
          {variant === 'danger' && (
            <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 text-sm text-muted-foreground">
          {description}
        </div>
        {children}
        <DialogFooter className="mt-4 flex flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
