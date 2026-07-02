import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  max = 100,
  className,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <progress
      value={value}
      max={max}
      aria-label={label ?? `Progress: ${pct}%`}
      className={cn('h-2 w-full overflow-hidden rounded-full accent-primary', className)}
    />
  );
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                isComplete && 'bg-primary text-primary-foreground',
                isActive && 'bg-primary/20 text-primary ring-2 ring-primary/40',
                !isActive && !isComplete && 'bg-muted text-muted-foreground'
              )}
              aria-hidden="true"
            >
              {isComplete ? '\u2713' : i + 1}
            </span>
            <span
              className={cn(
                isActive && 'font-medium text-foreground',
                !isActive && 'text-muted-foreground'
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
