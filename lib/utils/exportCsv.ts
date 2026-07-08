/**
 * Converts an array of ActivityRecord objects to a CSV string and triggers
 * a browser file download named `emissions-export-YYYY-MM-DD.csv`.
 */
import type { ActivityRecord } from '@/types/api';

const SCOPE_LABELS: Record<string, string> = {
  SCOPE_1: 'Scope 1',
  SCOPE_2: 'Scope 2',
  SCOPE_3: 'Scope 3',
};

/**
 * Wraps a CSV cell value in double-quotes if it contains commas, newlines,
 * or double-quote characters. Double-quotes inside the value are escaped
 * by doubling them (RFC 4180 §2.7).
 */
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Accepts an array of ActivityRecord objects, converts them to a CSV string
 * with the standard emissions headers, and triggers a browser download with
 * the filename `emissions-export-YYYY-MM-DD.csv`.
 */
export function exportActivitiesAsCsv(activities: ActivityRecord[]): void {
  const headers = [
    'Date',
    'Activity Type',
    'Scope',
    'Category',
    'Supplier',
    'Facility',
    'Amount',
    'Unit',
    'Emissions (kg CO2e)',
  ];

  const rows = activities.map((a) => [
    new Date(a.dateRecorded).toISOString().slice(0, 10),
    a.type,
    SCOPE_LABELS[a.factor.scope] ?? a.factor.scope,
    a.factor.category,
    a.supplier?.name ?? '',
    a.facility?.name ?? '',
    a.amount,
    a.unit,
    a.emissionsKg.toFixed(4),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `emissions-export-${today}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
