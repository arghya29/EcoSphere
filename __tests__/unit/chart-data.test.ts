describe('Chart Data Mapping Formatting', () => {
  it('correctly maps raw emission values to chart datasets', () => {
    const trend = [
      { month: '2025-01', emissionsKg: 15000 },
      { month: '2025-02', emissionsKg: 18500 },
    ];
    const mapped = trend.map((t) => ({ month: t.month, emissions: t.emissionsKg }));
    expect(mapped[0].emissions).toBe(15000);
    expect(mapped[1].month).toBe('2025-02');
  });

  it('filters empty scopes from scope breakdown dataset', () => {
    const scopeData = [
      { name: 'Scope 1', value: 0 },
      { name: 'Scope 2', value: 5000 },
      { name: 'Scope 3', value: 20000 },
    ];
    const filtered = scopeData.filter((d) => d.value > 0);
    expect(filtered.length).toBe(2);
    expect(filtered.find((d) => d.name === 'Scope 1')).toBeUndefined();
  });
});
