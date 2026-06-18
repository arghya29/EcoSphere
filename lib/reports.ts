import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { formatKg } from './utils';
import type { DashboardSummary, InsightRecord } from '@/types/api';

export function downloadJsonReport(summary: DashboardSummary, insights: InsightRecord[], orgName: string) {
  const payload = {
    organization: orgName,
    generatedAt: new Date().toISOString(),
    totals: { scope1: summary.scope1, scope2: summary.scope2, scope3: summary.scope3, total: summary.total },
    topSuppliers: summary.topSuppliers,
    topFacilities: summary.topFacilities,
    monthlyTrend: summary.monthlyTrend,
    insights: insights.map((i) => ({ kind: i.kind, text: i.text, detail: i.detail })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  saveAs(blob, `ecosphere-report-${dateStamp()}.json`);
}

export function downloadCsvReport(summary: DashboardSummary) {
  const rows = [
    { category: 'Scope 1', emissions_kg_co2e: summary.scope1 },
    { category: 'Scope 2', emissions_kg_co2e: summary.scope2 },
    { category: 'Scope 3', emissions_kg_co2e: summary.scope3 },
    { category: 'Total', emissions_kg_co2e: summary.total },
    ...summary.topSuppliers.map((s) => ({ category: `Supplier: ${s.name}`, emissions_kg_co2e: s.emissionsKg })),
    ...summary.topFacilities.map((f) => ({ category: `Facility: ${f.name}`, emissions_kg_co2e: f.emissionsKg })),
  ];
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `ecosphere-report-${dateStamp()}.csv`);
}

export function downloadPdfReport(summary: DashboardSummary, insights: InsightRecord[], orgName: string) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('EcoSphere — Carbon Footprint Report', 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(orgName, 14, 26);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 32);

  doc.setTextColor(20);
  doc.setFontSize(13);
  doc.text(`Total emissions: ${formatKg(summary.total)}`, 14, 44);

  autoTable(doc, {
    startY: 50,
    head: [['Scope', 'Emissions', 'Share']],
    body: [
      ['Scope 1', formatKg(summary.scope1), pct(summary.scope1, summary.total)],
      ['Scope 2', formatKg(summary.scope2), pct(summary.scope2, summary.total)],
      ['Scope 3', formatKg(summary.scope3), pct(summary.scope3, summary.total)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (summary.topSuppliers.length > 0) {
    doc.setFontSize(13);
    doc.text('Top emitters', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Supplier', 'Emissions']],
      body: summary.topSuppliers.map((s) => [s.name, formatKg(s.emissionsKg)]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (insights.length > 0) {
    doc.setFontSize(13);
    doc.text('Key insights', 14, y);
    y += 6;
    doc.setFontSize(10);
    for (const insight of insights.slice(0, 8)) {
      const lines = doc.splitTextToSize(`• ${insight.text}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
    }
  }

  doc.save(`ecosphere-report-${dateStamp()}.pdf`);
}

function pct(value: number, total: number): string {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : '—';
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
