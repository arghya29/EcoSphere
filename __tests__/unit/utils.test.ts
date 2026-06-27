import { findUnauthorizedIds, formatKg, formatPercent } from '@/lib/utils';

describe('findUnauthorizedIds', () => {
  it('returns an empty array when every referenced id is owned', () => {
    expect(findUnauthorizedIds(['a', 'b'], ['a', 'b', 'c'])).toEqual([]);
  });

  it('returns referenced ids that are not in the owned set (cross-org IDs)', () => {
    // Regression for #15: an activity referencing another org's entity id must
    // be flagged. Here 'org-b-facility' is referenced but not owned.
    expect(findUnauthorizedIds(['own-1', 'org-b-facility'], ['own-1'])).toEqual(['org-b-facility']);
  });

  it('flags every referenced id when none are owned', () => {
    expect(findUnauthorizedIds(['x', 'y'], [])).toEqual(['x', 'y']);
  });

  it('returns an empty array when there are no referenced ids', () => {
    expect(findUnauthorizedIds([], ['a', 'b'])).toEqual([]);
  });

  it('preserves the order of referenced ids and does not deduplicate input', () => {
    expect(findUnauthorizedIds(['b', 'a', 'b'], ['a'])).toEqual(['b', 'b']);
  });
});

describe('formatKg', () => {
  it('formats sub-tonne values in kg', () => {
    expect(formatKg(500)).toContain('kg');
  });

  it('formats values >= 1000 in tonnes', () => {
    expect(formatKg(2000)).toContain('t');
  });
});

describe('formatPercent', () => {
  it('rounds a 0-1 fraction to a whole-number percentage', () => {
    expect(formatPercent(0.755)).toBe('76%');
  });
});
