'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToastProgressProps {
  durationMs: number;
  paused: boolean;
  onComplete: () => void;
  variant: 'success' | 'error' | 'warning' | 'info';
}

export function ToastProgress({ durationMs, paused, onComplete, variant }: ToastProgressProps) {
  const [elapsed, setElapsed] = React.useState(0);
  const startRef = React.useRef(Date.now());
  const rafRef = React.useRef<number | null>(null);
  const completeRef = React.useRef(onComplete);
  completeRef.current = onComplete;

  React.useEffect(() => {
    if (paused) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (elapsed >= durationMs) {
      completeRef.current();
      return;
    }

    const tick = () => {
      const now = Date.now();
      const delta = now - startRef.current;
      const newElapsed = Math.min(elapsed + delta, durationMs);
      setElapsed(newElapsed);
      startRef.current = now;

      if (newElapsed < durationMs) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        completeRef.current();
      }
    };

    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [paused, durationMs, elapsed]);

  const pct = Math.min((elapsed / durationMs) * 100, 100);

  const barColors: Record<string, string> = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl bg-black/5 dark:bg-white/5">
      <div
        className={cn('h-full transition-[width] duration-100 linear', barColors[variant])}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Notification auto-dismiss progress"
      />
    </div>
  );
}
