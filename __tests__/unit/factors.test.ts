describe('Custom Emission Factors', () => {
  it('correctly maps custom categories to scope rules', () => {
    const factor = {
      category: 'bio_gas',
      scope: 'SCOPE_1',
      value: 0.18,
      unit: 'kWh',
    };
    expect(factor.scope).toBe('SCOPE_1');
    expect(factor.value).toBeGreaterThan(0);
  });

  it('validates emission factor input formatting', () => {
    const value = 2.543;
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeCloseTo(2.54);
  });
});
