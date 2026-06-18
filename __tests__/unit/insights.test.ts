import { generateInsights } from '@/lib/insights';
import type { ScopeBreakdown, EntityEmissions } from '@/lib/emissions';

function scopes(overrides: Partial<ScopeBreakdown>): ScopeBreakdown {
  return { scope1: 0, scope2: 0, scope3: 0, total: 0, ...overrides };
}

describe('generateInsights', () => {
  it('returns no insights when there are no emissions at all', () => {
    const result = generateInsights({
      scopes: scopes({ total: 0 }),
      topSuppliers: [],
      topFacilities: [],
      routes: [],
    });
    expect(result).toEqual([]);
  });

  it('flags a top supplier exceeding 30% of total emissions', () => {
    const topSuppliers: EntityEmissions[] = [
      { id: 's1', name: 'Supplier X', emissionsKg: 4000 },
      { id: 's2', name: 'Supplier Y', emissionsKg: 1000 },
    ];
    const result = generateInsights({
      scopes: scopes({ total: 10000 }),
      topSuppliers,
      topFacilities: [],
      routes: [],
    });
    const hotspot = result.find((i) => i.id === 'top-supplier-s1');
    expect(hotspot).toBeDefined();
    expect(hotspot?.text).toContain('Supplier X');
    expect(hotspot?.text).toContain('40%');
  });

  it('does not flag a top supplier under the 30% threshold', () => {
    const topSuppliers: EntityEmissions[] = [{ id: 's1', name: 'Supplier X', emissionsKg: 2000 }];
    const result = generateInsights({
      scopes: scopes({ total: 10000 }),
      topSuppliers,
      topFacilities: [],
      routes: [],
    });
    expect(result.find((i) => i.id === 'top-supplier-s1')).toBeUndefined();
  });

  it('flags air freight when it is over 50% of route emissions', () => {
    const result = generateInsights({
      scopes: scopes({ total: 10000, scope3: 8000 }),
      topSuppliers: [],
      topFacilities: [],
      routes: [
        { id: 'r1', name: 'Route A', emissionsKg: 6000, mode: 'AIR' },
        { id: 'r2', name: 'Route B', emissionsKg: 2000, mode: 'TRUCK' },
      ],
    });
    const airInsight = result.find((i) => i.id === 'air-freight-share');
    expect(airInsight).toBeDefined();
    expect(airInsight?.detail).toContain('rail');
  });

  it('flags an individual high-emission air route even if air is not the majority overall', () => {
    const result = generateInsights({
      scopes: scopes({ total: 10000, scope3: 4000 }),
      topSuppliers: [],
      topFacilities: [],
      routes: [
        { id: 'r1', name: 'Route A', emissionsKg: 1800, mode: 'AIR' },
        { id: 'r2', name: 'Route B', emissionsKg: 1000, mode: 'SEA' },
        { id: 'r3', name: 'Route C', emissionsKg: 1200, mode: 'TRUCK' },
      ],
    });
    const routeInsight = result.find((i) => i.id === 'route-r1');
    expect(routeInsight).toBeDefined();
    expect(routeInsight?.text).toContain('Route A');
  });

  it('flags Scope 2 share when purchased electricity exceeds 30% of total', () => {
    const result = generateInsights({
      scopes: scopes({ total: 10000, scope2: 4000 }),
      topSuppliers: [],
      topFacilities: [],
      routes: [],
    });
    const breakdown = result.find((i) => i.id === 'scope2-share');
    expect(breakdown).toBeDefined();
    expect(breakdown?.text).toContain('40%');
  });

  it('flags an anomalous facility emitting 3x+ the average of its peers', () => {
    const topFacilities: EntityEmissions[] = [
      { id: 'f1', name: 'Factory A', emissionsKg: 9000 },
      { id: 'f2', name: 'Factory B', emissionsKg: 500 },
      { id: 'f3', name: 'Factory C', emissionsKg: 500 },
    ];
    const result = generateInsights({
      scopes: scopes({ total: 10000 }),
      topSuppliers: [],
      topFacilities,
      routes: [],
    });
    expect(result.find((i) => i.id === 'anomaly-f1')).toBeDefined();
  });

  it('does not flag anomaly when emissions are evenly distributed', () => {
    const topFacilities: EntityEmissions[] = [
      { id: 'f1', name: 'Factory A', emissionsKg: 1000 },
      { id: 'f2', name: 'Factory B', emissionsKg: 1100 },
      { id: 'f3', name: 'Factory C', emissionsKg: 900 },
    ];
    const result = generateInsights({
      scopes: scopes({ total: 3000 }),
      topSuppliers: [],
      topFacilities,
      routes: [],
    });
    expect(result.some((i) => i.kind === 'anomaly')).toBe(false);
  });
});
