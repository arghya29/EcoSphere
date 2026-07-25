import * as React from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastProgress } from './toast-progress';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  title,
  description,
  variant = 'info',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const exitTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      onCloseRef.current();
    }, 300);
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  const variantStyles = {
    success:
      'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500/20 text-emerald-900 dark:text-emerald-200',
    error: 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-500/20 text-rose-900 dark:text-rose-200',
    warning:
      'bg-amber-50/90 dark:bg-amber-950/30 border-amber-500/20 text-amber-900 dark:text-amber-200',
    info: 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-500/20 text-sky-900 dark:text-sky-200',
  };

  return (
    <div
      className={cn(
        'relative flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 ease-out transform overflow-hidden',
        variantStyles[variant],
        isMounted && !isExiting
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-4 scale-95'
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && <p className="mt-1 text-xs opacity-90 leading-normal">{description}</p>}
      </div>
      <button
        onClick={handleClose}
        type="button"
        className="rounded-lg p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
      <ToastProgress
        durationMs={duration}
        paused={paused}
        onComplete={handleClose}
        variant={variant}
      />
    </div>
  );
}
