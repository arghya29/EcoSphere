'use client';

import * as React from 'react';
import { Toast, type ToastVariant } from './toast-notification';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: {
    (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive' | 'default'; duration?: number }): void;
    success: (title: string, description?: string, duration?: number) => void;
    error: (title: string, description?: string, duration?: number) => void;
    warning: (title: string, description?: string, duration?: number) => void;
    info: (title: string, description?: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

const MAX_TOASTS = 5;
const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  error: 6000,
  warning: 5000,
  info: 4000,
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (title: string, description?: string, variant: ToastVariant = 'info', duration?: number) => {
      const id = `${Date.now()}-${toastCounter++}`;
      setToasts((prev) => {
        const next = [...prev, { id, title, description, variant, duration }];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
    },
    []
  );

  const toastCallable = React.useMemo(() => {
    const fn = (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive' | 'default'; duration?: number }) => {
      const mappedVariant: ToastVariant =
        options.variant === 'destructive'
          ? 'error'
          : options.variant === 'default'
          ? 'info'
          : (options.variant as ToastVariant) || 'info';

      addToast(options.title, options.description, mappedVariant, options.duration);
    };

    fn.success = (title: string, description?: string, duration?: number) => addToast(title, description, 'success', duration);
    fn.error = (title: string, description?: string, duration?: number) => addToast(title, description, 'error', duration);
    fn.warning = (title: string, description?: string, duration?: number) => addToast(title, description, 'warning', duration);
    fn.info = (title: string, description?: string, duration?: number) => addToast(title, description, 'info', duration);

    return fn;
  }, [addToast]);

  const contextValue = React.useMemo(() => ({ toast: toastCallable, dismiss }), [toastCallable, dismiss]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <Toast
              id={t.id}
              title={t.title}
              description={t.description}
              variant={t.variant}
              duration={t.duration ?? DEFAULT_DURATIONS[t.variant ?? 'info']}
              onClose={() => dismiss(t.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export { DEFAULT_DURATIONS, MAX_TOASTS };

