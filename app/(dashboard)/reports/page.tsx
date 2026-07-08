'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/components/ui/ToastProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { downloadJsonReport, downloadCsvReport, downloadPdfReport } from '@/lib/reports';
import { FileText, FileSpreadsheet, FileJson, FileDown } from 'lucide-react';
import type { DashboardSummary, InsightRecord } from '@/types/api';

interface ReportRecord {
  id: string;
  format: 'PDF' | 'CSV' | 'JSON';
  createdAt: string;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { data: summary } = useApi<DashboardSummary>('/api/dashboard');
  const { data: insightsData } = useApi<{ insights: InsightRecord[] }>('/api/insights');
  const { data: history, refetch } = useApi<ReportRecord[]>('/api/reports');
  const [title, setTitle] = React.useState('Carbon Footprint Report');
  const [themeColor, setThemeColor] = React.useState('#1e3a5f');
  const [includeSummary, setIncludeSummary] = React.useState(true);
  const [includeDetails, setIncludeDetails] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState<string | null>(null);

  const recordReport = async (format: 'PDF' | 'CSV' | 'JSON') => {
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format,
        options: {
          title,
          themeColor,
          includeSummary,
          includeDetails,
        },
      }),
    });
    refetch();
  };

  const handleExport = async (format: 'PDF' | 'CSV' | 'JSON') => {
    if (!summary) return;
    setIsGenerating(format);
    try {
      const insights = insightsData?.insights ?? [];
      const orgName = title || 'Your Organization';
      if (format === 'PDF') downloadPdfReport(summary, insights, orgName);
      if (format === 'CSV') downloadCsvReport(summary);
      if (format === 'JSON') downloadJsonReport(summary, insights, orgName);
      await recordReport(format);
      toast({ title: `${format} report downloaded` });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Export your footprint as PDF, CSV, or JSON — generated entirely in your browser.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Customize Report</CardTitle>
            <CardDescription>Visual options for generated documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="custom-title" className="text-xs font-semibold text-muted-foreground">Report Header Title</label>
              <Input
                id="custom-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="theme-color" className="text-xs font-semibold text-muted-foreground">Theme Color</label>
              <select
                id="theme-color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-full rounded border bg-background px-3 py-1.5 text-sm"
              >
                <option value="#1e3a5f">Deep Blue (#1e3a5f)</option>
                <option value="#2f6f4f">Forest Green (#2f6f4f)</option>
                <option value="#b3261e">Crimson Red (#b3261e)</option>
                <option value="#6b7280">Neutral Gray (#6b7280)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="inc-summary"
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
              />
              <label htmlFor="inc-summary" className="text-xs font-semibold text-muted-foreground">Include Summary Section</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="inc-details"
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
              />
              <label htmlFor="inc-details" className="text-xs font-semibold text-muted-foreground">Include Detailed Table Section</label>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 align-start">
          <ExportCard
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            title="PDF report"
            description="Formatted summary with charts data, top emitters, and key insights."
            onClick={() => handleExport('PDF')}
            isLoading={isGenerating === 'PDF'}
            disabled={!summary}
          />
          <ExportCard
            icon={<FileSpreadsheet className="h-5 w-5" aria-hidden="true" />}
            title="CSV export"
            description="Raw totals and per-entity emissions, ready for a spreadsheet."
            onClick={() => handleExport('CSV')}
            isLoading={isGenerating === 'CSV'}
            disabled={!summary}
          />
          <ExportCard
            icon={<FileJson className="h-5 w-5" aria-hidden="true" />}
            title="JSON export"
            description="Machine-readable export for downstream tools or your own scripts."
            onClick={() => handleExport('JSON')}
            isLoading={isGenerating === 'JSON'}
            disabled={!summary}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Export history</CardTitle>
          <CardDescription>Recent reports generated for this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <EmptyState
              icon={FileDown}
              title="No reports generated yet"
              description="Export your first report above — it will appear here in the history."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((r) => (
                <li key={r.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                  <span className="font-medium">{r.format}</span>
                  <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  onClick,
  isLoading,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={onClick} disabled={disabled || isLoading} size="sm" className="w-fit">
          {isLoading ? 'Generating…' : 'Download'}
        </Button>
      </CardContent>
    </Card>
  );
}
