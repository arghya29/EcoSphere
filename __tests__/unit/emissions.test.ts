import { calculateActivityEmissions, aggregateByScope, aggregateByEntity, aggregateByMonth } from '@/lib/emissions';
import type { ActivityWithFactor } from '@/lib/emissions';

function makeActivity(
  overrides: Partial<Omit<ActivityWithFactor, 'factor'>> & { factor?: Partial<ActivityWithFactor['factor']> }
): ActivityWithFactor {
  const { factor: factorOverrides, ...activityOverrides } = overrides;
  return {
    id: 'act-1',
    organizationId: 'org-1',
    type: 'FUEL',
    supplierId: null,
    facilityId: null,
    routeId: null,
    amount: 100,
    unit: 'litre',
    factorId: 'factor-1',
    emissionsKg: 0,
    dateRecorded: new Date('2026-01-15'),
    createdAt: new Date(),
    ...activityOverrides,
    factor: {
      id: 'factor-1',
      category: 'diesel',
      scope: 'SCOPE_1',
      value: 2.68,
      unit: 'kgCO2e/litre',
      source: null,
      ...factorOverrides,
    },
  } as ActivityWithFactor;
}

describe('calculateActivityEmissions', () => {
  it('multiplies amount by factor value', () => {
    expect(calculateActivityEmissions(500, 2.68)).toBeCloseTo(1340);
  });

  it('matches the worked example from the proposal: 500L diesel at 2.68 kgCO2e/L = 1340 kgCO2e', () => {
    expect(calculateActivityEmissions(500, 2.68)).toBe(1340);
  });

  it('returns 0 for non-finite inputs instead of NaN', () => {
    expect(calculateActivityEmissions(NaN, 2.68)).toBe(0);
    expect(calculateActivityEmissions(500, Infinity)).toBe(0);
  });

  it('handles zero amount', () => {
    expect(calculateActivityEmissions(0, 2.68)).toBe(0);
  });
});

describe('aggregateByScope', () => {
  it('sums emissions into the correct scope bucket', () => {
    const activities = [
      makeActivity({ emissionsKg: 1340, factor: { scope: 'SCOPE_1' } }),
      makeActivity({ emissionsKg: 2484, factor: { scope: 'SCOPE_2', category: 'electricity_UK-grid' } }),
      makeActivity({ emissionsKg: 4816, factor: { scope: 'SCOPE_3', category: 'air_freight' } }),
    ];

    const result = aggregateByScope(activities);
    expect(result.scope1).toBe(1340);
    expect(result.scope2).toBe(2484);
    expect(result.scope3).toBe(4816);
    expect(result.total).toBe(1340 + 2484 + 4816);
  });

  it('falls back to amount * factor.value when emissionsKg is missing', () => {
    const activities = [makeActivity({ emissionsKg: undefined as unknown as number, amount: 500, factor: { value: 2.68 } })];
    const result = aggregateByScope(activities);
    expect(result.scope1).toBeCloseTo(1340);
  });

  it('returns all zeros for an empty activity list', () => {
    const result = aggregateByScope([]);
    expect(result).toEqual({ scope1: 0, scope2: 0, scope3: 0, total: 0 });
  });
});

describe('aggregateByEntity', () => {
  it('groups and sums emissions per supplier', () => {
    const activities = [
      makeActivity({ supplierId: 's1', emissionsKg: 1000 }),
      makeActivity({ supplierId: 's1', emissionsKg: 500 }),
      makeActivity({ supplierId: 's2', emissionsKg: 200 }),
    ];
    const entities = [
      { id: 's1', name: 'Supplier A' },
      { id: 's2', name: 'Supplier B' },
    ];

    const result = aggregateByEntity(activities, 'supplier', entities);
    expect(result).toEqual([
      { id: 's1', name: 'Supplier A', emissionsKg: 1500 },
      { id: 's2', name: 'Supplier B', emissionsKg: 200 },
    ]);
  });

  it('sorts results descending by emissions', () => {
    const activities = [
      makeActivity({ facilityId: 'f1', emissionsKg: 100 }),
      makeActivity({ facilityId: 'f2', emissionsKg: 900 }),
    ];
    const entities = [
      { id: 'f1', name: 'Factory A' },
      { id: 'f2', name: 'Factory B' },
    ];
    const result = aggregateByEntity(activities, 'facility', entities);
    expect(result[0].name).toBe('Factory B');
  });

  it('ignores activities with no matching entity id for the requested type', () => {
    const activities = [makeActivity({ supplierId: null, facilityId: null, routeId: null, emissionsKg: 500 })];
    const result = aggregateByEntity(activities, 'supplier', []);
    expect(result).toEqual([]);
  });
});

describe('aggregateByMonth', () => {
  it('buckets activities by year-month and sums emissions', () => {
    const activities = [
      makeActivity({ dateRecorded: new Date('2026-01-05'), emissionsKg: 100 }),
      makeActivity({ dateRecorded: new Date('2026-01-20'), emissionsKg: 200 }),
      makeActivity({ dateRecorded: new Date('2026-02-01'), emissionsKg: 50 }),
    ];
    const result = aggregateByMonth(activities);
    expect(result).toEqual([
      { month: '2026-01', emissionsKg: 300 },
      { month: '2026-02', emissionsKg: 50 },
    ]);
  });

  it('buckets a midnight-UTC first-of-month date by UTC, not local timezone', () => {
    // An activity recorded at exactly 2026-03-01T00:00:00Z must land in March
    // regardless of the server/browser timezone. With local-timezone getters a
    // UTC-behind zone (e.g. America/Los_Angeles) would resolve this to the
    // previous day and misgroup it under February.
    const activities = [
      makeActivity({
        dateRecorded: new Date('2026-03-01T00:00:00Z'),
        emissionsKg: 42,
      }),
    ];
    const result = aggregateByMonth(activities);
    expect(result).toEqual([{ month: '2026-03', emissionsKg: 42 }]);
  });
});
