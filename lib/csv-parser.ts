import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  rowCount: number;
}

export interface ValidationError {
  column: string;
  message: string;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const isExcel = /\.xlsx?$/i.test(file.name);

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
      raw: false,
      defval: '',
    });
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { headers, rows, fileName: file.name, rowCount: rows.length };
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        resolve({ headers, rows: result.data, fileName: file.name, rowCount: result.data.length });
      },
      error: (err) => reject(err),
    });
  });
}

export type UploadSchemaKind = 'suppliers' | 'facilities' | 'activities';

export const REQUIRED_COLUMNS: Record<UploadSchemaKind, string[]> = {
  suppliers: ['name'],
  facilities: ['name'],
  activities: ['factor_category', 'amount', 'unit', 'date'],
};

export function validateColumns(kind: UploadSchemaKind, headers: string[]): string[] {
  const missing = REQUIRED_COLUMNS[kind].filter((col) => !headers.includes(col));
  return missing;
}

export function validateRows(
  kind: UploadSchemaKind,
  rows: Record<string, string>[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (kind === 'activities') {
      if (!row.factor_category || row.factor_category.trim() === '') {
        errors.push({
          column: 'factor_category',
          message: `Row ${rowNum}: factor_category is required`,
        });
      }
      if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
        errors.push({
          column: 'amount',
          message: `Row ${rowNum}: amount must be a positive number`,
        });
      }
      if (!row.unit || row.unit.trim() === '') {
        errors.push({ column: 'unit', message: `Row ${rowNum}: unit is required` });
      }
      if (!row.date || !isoDatePattern.test(row.date) || isNaN(Date.parse(row.date))) {
        errors.push({
          column: 'date',
          message: `Row ${rowNum}: date must be a valid date (YYYY-MM-DD)`,
        });
      }
    }

    if (kind === 'suppliers' || kind === 'facilities') {
      if (!row.name || row.name.trim() === '') {
        errors.push({ column: 'name', message: `Row ${rowNum}: name is required` });
      }
      if (row.latitude && row.latitude.trim() !== '') {
        const lat = Number(row.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.push({
            column: 'latitude',
            message: `Row ${rowNum}: latitude must be a valid number between -90 and 90`,
          });
        }
      }
      if (row.longitude && row.longitude.trim() !== '') {
        const lng = Number(row.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          errors.push({
            column: 'longitude',
            message: `Row ${rowNum}: longitude must be a valid number between -180 and 180`,
          });
        }
      }
    }
  }

  return errors;
}
