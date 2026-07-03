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
    (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive' | 'default' }): void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (title: string, description?: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${toastCounter++}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
    },
    []
  );

  // Expose toast as a callable function (for backwards compatibility) and attach sub-methods
  const toastCallable = React.useMemo(() => {
    const fn = (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' | 'destructive' | 'default' }) => {
      const mappedVariant: ToastVariant =
        options.variant === 'destructive'
          ? 'error'
          : options.variant === 'default'
          ? 'info'
          : (options.variant as ToastVariant) || 'info';

      addToast(options.title, options.description, mappedVariant);
    };

    fn.success = (title: string, description?: string) => addToast(title, description, 'success');
    fn.error = (title: string, description?: string) => addToast(title, description, 'error');
    fn.warning = (title: string, description?: string) => addToast(title, description, 'warning');
    fn.info = (title: string, description?: string) => addToast(title, description, 'info');

    return fn;
  }, [addToast]);

  const contextValue = React.useMemo(() => ({ toast: toastCallable }), [toastCallable]);

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
