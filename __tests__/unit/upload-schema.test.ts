import { uploadSchema, MAX_UPLOAD_ROWS, tooManyRowsMessage } from '@/app/api/upload/schema';

function supplierRow(i: number) {
  return { name: `Supplier ${i}`, location: 'NY' };
}

describe('uploadSchema row-count limit (regression for #28)', () => {
  it('rejects a suppliers payload with more than MAX_UPLOAD_ROWS rows', () => {
    const rows = Array.from({ length: MAX_UPLOAD_ROWS + 1 }, (_, i) => supplierRow(i));
    const result = uploadSchema.safeParse({ kind: 'suppliers', rows });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(tooManyRowsMessage);
    }
  });

  it('accepts a suppliers payload with exactly MAX_UPLOAD_ROWS rows (boundary)', () => {
    const rows = Array.from({ length: MAX_UPLOAD_ROWS }, (_, i) => supplierRow(i));
    const result = uploadSchema.safeParse({ kind: 'suppliers', rows });

    expect(result.success).toBe(true);
  });

  it('rejects a facilities payload with more than MAX_UPLOAD_ROWS rows', () => {
    const rows = Array.from({ length: MAX_UPLOAD_ROWS + 1 }, (_, i) => ({
      name: `Facility ${i}`,
      type: 'warehouse',
    }));
    const result = uploadSchema.safeParse({ kind: 'facilities', rows });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(tooManyRowsMessage);
    }
  });

  it('rejects an activities payload with more than MAX_UPLOAD_ROWS rows', () => {
    const rows = Array.from({ length: MAX_UPLOAD_ROWS + 1 }, () => ({
      facility_id: null,
      route_id: null,
      supplier_id: null,
      factor_category: 'natural_gas',
      amount: 10,
      unit: 'kWh',
      date: '2026-07-01',
    }));
    const result = uploadSchema.safeParse({ kind: 'activities', rows });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(tooManyRowsMessage);
    }
  });

  it('still accepts a small, well-formed suppliers payload (no regression on the happy path)', () => {
    const result = uploadSchema.safeParse({
      kind: 'suppliers',
      rows: [{ name: 'Acme Co', location: 'CA' }],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown kind', () => {
    const result = uploadSchema.safeParse({ kind: 'bogus', rows: [] });
    expect(result.success).toBe(false);
  });
});
