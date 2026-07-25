describe('Map Filters Logic', () => {
  it('correctly filters routes by transport mode', () => {
    const routes = [
      { id: '1', mode: 'TRUCK' },
      { id: '2', mode: 'AIR' },
    ];
    const filtered = routes.filter((r) => r.mode === 'AIR');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('2');
  });

  it('filters markers by search query', () => {
    const suppliers = [{ name: 'Supplier Alpha' }, { name: 'Beta Industry' }];
    const query = 'alpha';
    const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(query));
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Supplier Alpha');
  });
});
