import type { TrendData } from '@/lib/utils/analytics';

const arrowUp = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const arrowDown = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const arrowFlat = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function TrendIndicator({ trend }: { trend: TrendData }) {
  const icon = trend.direction === 'up' ? arrowUp : trend.direction === 'down' ? arrowDown : arrowFlat;
  const colorClass = trend.direction === 'up' ? 'text-destructive' : trend.direction === 'down' ? 'text-green-600' : 'text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${colorClass}`}
      title={trend.label}
      aria-label={trend.label}
    >
      {icon}
      <span aria-hidden="true">{trend.percentage}%</span>
    </span>
  );
}
