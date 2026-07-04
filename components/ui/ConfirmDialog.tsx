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

  const variantConfig = {
    danger: {
      border: 'border-red-500/20',
      icon: AlertTriangle,
      iconClass: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    },
    warning: {
      border: 'border-yellow-500/20',
      icon: AlertTriangle,
      iconClass: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400',
    },
    info: {
      border: 'border-blue-500/20',
      icon: Info,
      iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
  };
  const { border, icon: Icon, iconClass } = variantConfig[variant];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-[400px] border ${border} bg-background dark:bg-card`}>
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className={`rounded-full p-2 ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
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
