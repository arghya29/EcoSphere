import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const isExcel = /\.xlsx?$/i.test(file.name);

  if (isExcel) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { raw: false, defval: '' });
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { headers, rows };
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        resolve({ headers, rows: result.data });
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
