import { validateRows } from '@/lib/csv-parser';

describe('CSV Upload Coordinate Validation', () => {
  it('detects invalid latitude values', () => {
    const rows = [
      { name: 'Supplier A', latitude: '95.5', longitude: '100' },
      { name: 'Supplier B', latitude: 'invalid', longitude: '100' },
    ];
    const errors = validateRows('suppliers', rows);
    expect(errors.length).toBe(2);
    expect(errors[0].column).toBe('latitude');
    expect(errors[1].column).toBe('latitude');
  });

  it('detects invalid longitude values', () => {
    const rows = [
      { name: 'Facility A', latitude: '45.2', longitude: '200' },
      { name: 'Facility B', latitude: '45.2', longitude: '-190' },
    ];
    const errors = validateRows('facilities', rows);
    expect(errors.length).toBe(2);
    expect(errors[0].column).toBe('longitude');
  });

  it('passes valid coordinates', () => {
    const rows = [
      { name: 'Facility A', latitude: '0', longitude: '0' },
      { name: 'Facility B', latitude: '-89.9', longitude: '179.9' },
    ];
    const errors = validateRows('facilities', rows);
    expect(errors.length).toBe(0);
  });
});
