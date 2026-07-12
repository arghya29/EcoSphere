import { mapMonthlyTrend, toScopeBreakdownData } from '@/lib/utils/chart-helpers';

describe('Chart Data Mapping Formatting', () => {
  it('correctly maps raw emission values to chart datasets', () => {
    const trend = [
      { month: '2025-01', emissionsKg: 15000 },
      { month: '2025-02', emissionsKg: 18500 },
    ];
    const mapped = mapMonthlyTrend(trend);
    expect(mapped[0].emissions).toBe(15000);
    expect(mapped[1].month).toBe('2025-02');
  });

  it('filters empty scopes from scope breakdown dataset', () => {
    const filtered = toScopeBreakdownData({
      scope1: 0,
      scope2: 5000,
      scope3: 20000,
    });
    expect(filtered.length).toBe(2);
    expect(filtered.find((d) => d.name.includes('Scope 1'))).toBeUndefined();
    expect(filtered.find((d) => d.name.includes('Scope 2'))?.value).toBe(5000);
  });
});

