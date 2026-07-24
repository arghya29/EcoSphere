import { guardNodeDeletion } from '@/lib/builder-delete';

describe('guardNodeDeletion', () => {
  it('does not block when there are no dependent routes', () => {
    expect(guardNodeDeletion('supplier', 0)).toEqual({ blocked: false });
    expect(guardNodeDeletion('facility', 0)).toEqual({ blocked: false });
  });

  it('treats a negative count defensively as "no dependents"', () => {
    expect(guardNodeDeletion('supplier', -1)).toEqual({ blocked: false });
  });

  it('blocks with a singular message for exactly one dependent route', () => {
    const result = guardNodeDeletion('supplier', 1);
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.error).toBe(
        'This supplier is still used by 1 route. Remove it first, then delete the supplier.'
      );
    }
  });

  it('blocks with a plural message for multiple dependent routes', () => {
    const result = guardNodeDeletion('facility', 3);
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.error).toBe(
        'This facility is still used by 3 routes. Remove them first, then delete the facility.'
      );
    }
  });

  it('uses the entity word in the message (supplier vs facility)', () => {
    const supplier = guardNodeDeletion('supplier', 2);
    const facility = guardNodeDeletion('facility', 2);
    expect(supplier.blocked).toBe(true);
    expect(facility.blocked).toBe(true);
    if (supplier.blocked)
      expect(supplier.error).toContain('This supplier is still used by 2 routes');
    if (facility.blocked)
      expect(facility.error).toContain('This facility is still used by 2 routes');
  });
});
