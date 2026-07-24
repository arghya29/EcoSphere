import { normalizeAndValidateRoutes } from '@/app/api/routes/validate';
import type { RouteInput } from '@/lib/validations';

function route(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    originSupplierId: 'supplier-1',
    originFacilityId: undefined,
    destinationId: 'facility-1',
    mode: 'TRUCK',
    distanceKm: 100,
    ...overrides,
  };
}

describe('normalizeAndValidateRoutes', () => {
  // Regression for the CodeRabbit finding on PR #26: a whitespace-only
  // destinationId passes Zod's z.string().min(1) (length 3 >= 1) but must be
  // rejected once trimmed, instead of silently becoming "" and reaching Prisma.
  it('rejects a whitespace-only destinationId after trimming', () => {
    const result = normalizeAndValidateRoutes([route({ destinationId: '   ' })]);
    expect(result).toEqual({ ok: false, error: 'Each route needs a destinationId.' });
  });

  it('rejects an empty-string destinationId', () => {
    const result = normalizeAndValidateRoutes([route({ destinationId: '' })]);
    expect(result).toEqual({ ok: false, error: 'Each route needs a destinationId.' });
  });

  it('trims a valid destinationId with surrounding whitespace', () => {
    const result = normalizeAndValidateRoutes([route({ destinationId: '  facility-1  ' })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routes[0].destinationId).toBe('facility-1');
    }
  });

  it('accepts a route with only originSupplierId set', () => {
    const result = normalizeAndValidateRoutes([
      route({ originSupplierId: 'supplier-1', originFacilityId: undefined }),
    ]);
    expect(result.ok).toBe(true);
  });

  it('accepts a route with only originFacilityId set', () => {
    const result = normalizeAndValidateRoutes([
      route({ originSupplierId: undefined, originFacilityId: 'facility-2' }),
    ]);
    expect(result.ok).toBe(true);
  });

  it('rejects a route with neither originSupplierId nor originFacilityId', () => {
    const result = normalizeAndValidateRoutes([
      route({ originSupplierId: undefined, originFacilityId: undefined }),
    ]);
    expect(result).toEqual({
      ok: false,
      error: 'Each route needs an originSupplierId or originFacilityId.',
    });
  });

  it('treats a whitespace-only originSupplierId as absent (normalizeOptionalId integration)', () => {
    const result = normalizeAndValidateRoutes([
      route({ originSupplierId: '   ', originFacilityId: undefined }),
    ]);
    expect(result).toEqual({
      ok: false,
      error: 'Each route needs an originSupplierId or originFacilityId.',
    });
  });

  it('checks destinationId before the origin-id check when both are invalid', () => {
    const result = normalizeAndValidateRoutes([
      route({ destinationId: '   ', originSupplierId: undefined, originFacilityId: undefined }),
    ]);
    expect(result).toEqual({ ok: false, error: 'Each route needs a destinationId.' });
  });

  it('rejects on the first invalid route in a multi-route batch, matching handler early-return behavior', () => {
    const result = normalizeAndValidateRoutes([
      route({ destinationId: 'facility-1' }),
      route({ destinationId: '   ' }),
      route({ destinationId: 'facility-3' }),
    ]);
    expect(result).toEqual({ ok: false, error: 'Each route needs a destinationId.' });
  });

  it('accepts a well-formed multi-route batch (no regression on the happy path)', () => {
    const result = normalizeAndValidateRoutes([
      route({ destinationId: 'facility-1' }),
      route({
        destinationId: 'facility-2',
        originSupplierId: undefined,
        originFacilityId: 'facility-9',
      }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routes).toHaveLength(2);
    }
  });
});
