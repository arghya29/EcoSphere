export interface TrendData {
  direction: 'up' | 'down' | 'flat';
  percentage: number;
  label: string;
}

export function computeTrend(previous: number, current: number): TrendData {
  if (previous === 0 && current === 0) {
    return { direction: 'flat', percentage: 0, label: 'No change' };
  }
  if (previous === 0) {
    return { direction: 'up', percentage: 100, label: 'New emissions recorded' };
  }
  const change = ((current - previous) / previous) * 100;
  const direction = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat';
  const absPct = Math.abs(Math.round(change * 10) / 10);
  const label =
    direction === 'up'
      ? `Up ${absPct}% from previous period`
      : direction === 'down'
        ? `Down ${absPct}% from previous period`
        : 'Stable compared to previous period';
  return { direction, percentage: absPct, label };
}

export function computeMonthlyChange(monthly: { month: string; emissionsKg: number }[]): TrendData {
  if (monthly.length < 2) {
    return { direction: 'flat', percentage: 0, label: 'Insufficient data for trend' };
  }
  const sorted = [...monthly].sort((a, b) => a.month.localeCompare(b.month));
  const latest = sorted[sorted.length - 1].emissionsKg;
  const previous = sorted[sorted.length - 2].emissionsKg;
  return computeTrend(previous, latest);
}

export function getTrendIcon(direction: 'up' | 'down' | 'flat'): string {
  switch (direction) {
    case 'up':
      return '\u2191';
    case 'down':
      return '\u2193';
    case 'flat':
      return '\u2192';
  }
}
