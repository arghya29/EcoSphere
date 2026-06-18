'use client';

import * as React from 'react';
import { parseFile, validateColumns, type ParsedFile, type UploadSchemaKind } from '@/lib/csv-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { UploadCloud, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SCHEMA_LABELS: Record<UploadSchemaKind, { title: string; description: string; example: string }> = {
  suppliers: {
    title: 'Suppliers',
    description: 'name, location, category, latitude, longitude',
    example: 'name,location,category,latitude,longitude',
  },
  facilities: {
    title: 'Facilities',
    description: 'name, type, location, latitude, longitude',
    example: 'name,type,location,latitude,longitude',
  },
  activities: {
    title: 'Activity / usage data',
    description: 'facility_id or route_id or supplier_id, factor_category, amount, unit, date',
    example: 'facility_id,factor_category,amount,unit,date',
  },
};

export function UploadForm({ kind, onUploaded }: { kind: UploadSchemaKind; onUploaded?: () => void }) {
  const { toast } = useToast();
  const [parsed, setParsed] = React.useState<ParsedFile | null>(null);
  const [missingColumns, setMissingColumns] = React.useState<string[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const label = SCHEMA_LABELS[kind];

  const handleFile = async (file: File) => {
    try {
      const result = await parseFile(file);
      setParsed(result);
      setMissingColumns(validateColumns(kind, result.headers));
    } catch (err) {
      toast({ title: 'Could not read file', description: 'Check that it is a valid CSV or Excel file.', variant: 'destructive' });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onConfirm = async () => {
    if (!parsed) return;
    setIsSubmitting(true);
    try {
      const rows = parsed.rows.map((row) => {
        if (kind === 'activities') {
          return {
            facility_id: row.facility_id || undefined,
            route_id: row.route_id || undefined,
            supplier_id: row.supplier_id || undefined,
            factor_category: row.factor_category,
            amount: row.amount,
            unit: row.unit,
            date: row.date,
          };
        }
        return {
          name: row.name,
          location: row.location || undefined,
          category: row.category || undefined,
          type: row.type || undefined,
          latitude: row.latitude || undefined,
          longitude: row.longitude || undefined,
        };
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, rows }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Upload failed');
      }

      toast({ title: 'Upload complete', description: `${json.data.length} ${label.title.toLowerCase()} imported.` });
      setParsed(null);
      onUploaded?.();
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please check your file and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{label.title}</CardTitle>
        <CardDescription>
          Expected columns: <span className="font-mono-data">{label.description}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors',
            isDragging ? 'border-primary bg-muted' : 'border-border'
          )}
        >
          <UploadCloud className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Drag and drop a CSV or Excel file here, or</p>
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            aria-label={`Upload ${label.title} file`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {parsed && (
          <div className="flex flex-col gap-3">
            {missingColumns.length > 0 && (
              <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Missing required column(s): {missingColumns.join(', ')}. Add them and re-upload.</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              {parsed.rows.length} rows detected. Preview of the first 5:
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted">
                  <tr>
                    {parsed.headers.map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {parsed.headers.map((h) => (
                        <td key={h} className="whitespace-nowrap px-3 py-2">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setParsed(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={onConfirm} disabled={missingColumns.length > 0 || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Importing…
                  </>
                ) : (
                  'Confirm & process'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
