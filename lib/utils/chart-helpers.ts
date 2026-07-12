export interface MonthlyTrendItem {
  month: string;
  emissionsKg: number;
}

export interface ScopeDataInput {
  scope1: number;
  scope2: number;
  scope3: number;
}

export function mapMonthlyTrend(trend: MonthlyTrendItem[]) {
  return trend.map((t) => ({ month: t.month, emissions: t.emissionsKg }));
}

export function toScopeBreakdownData(input: ScopeDataInput) {
  return [
    { name: 'Scope 1 (Direct)', value: input.scope1, color: '#1e3a5f' },
    { name: 'Scope 2 (Indirect Grid)', value: input.scope2, color: '#2f6f4f' },
    { name: 'Scope 3 (Supply Chain)', value: input.scope3, color: '#b8860b' },
  ].filter((d) => d.value > 0);
}
