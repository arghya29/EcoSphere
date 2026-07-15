'use client';

import * as React from 'react';
import { parseFile, validateColumns, validateRows, type ParsedFile, type UploadSchemaKind } from '@/lib/csv-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressSteps } from '@/components/ui/progress-bar';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/ToastProvider';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ValidationErrorList } from '@/components/ui/validation-error-list';
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

const UPLOAD_STEPS = ['Select file', 'Review & validate', 'Confirm import'];

export function UploadForm({ kind, onUploaded }: { kind: UploadSchemaKind; onUploaded?: () => void }) {
  const { toast } = useToast();
  const [parsed, setParsed] = React.useState<ParsedFile | null>(null);
  const [missingColumns, setMissingColumns] = React.useState<string[]>([]);
  const [rowErrors, setRowErrors] = React.useState<{ column: string; message: string }[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [previewPage, setPreviewPage] = React.useState(1);
  const [previewLimit, setPreviewLimit] = React.useState(50);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const label = SCHEMA_LABELS[kind];

  const handleFile = async (file: File) => {
    try {
      const result = await parseFile(file);
      setParsed(result);
      const missing = validateColumns(kind, result.headers);
      setMissingColumns(missing);
      const errors = missing.length === 0 ? validateRows(kind, result.rows) : [];
      setRowErrors(errors);
      setStep(missing.length === 0 && errors.length === 0 ? 1 : 0);
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
    setStep(2);
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
      setStep(0);
      setPreviewPage(1);
      onUploaded?.();
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Please check your file and try again.',
        variant: 'destructive',
      });
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-foreground">{label.title}</CardTitle>
            <CardDescription>
              Expected columns: <span className="font-mono-data">{label.description}</span>
            </CardDescription>
          </div>
        </div>
        {parsed && <ProgressSteps steps={UPLOAD_STEPS} currentStep={step} className="mt-3" />}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {step === 0 && (
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
        )}

        {parsed && step >= 1 && (
          <div className="flex flex-col gap-3" aria-live="polite" aria-atomic="true">
            {missingColumns.length > 0 && (
              <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Missing required columns</p>
                  {/* FIX 1: Template literal prevents stray spaces before the period */}
                  <p>{`${missingColumns.join(', ')}. Add them and re-upload.`}</p>
                </div>
              </div>
            )}

            {rowErrors.length > 0 && (
              <ValidationErrorList errors={rowErrors} />
            )}

            {missingColumns.length === 0 && rowErrors.length === 0 && (
              <div className="flex items-start gap-2 rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-600">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>All validations passed.</span>
              </div>
            )}

            {/* FIX 2: Only render the preview table if the schema (columns) are valid */}
            {missingColumns.length === 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                  {parsed.fileName} &mdash; {parsed.rowCount} rows detected. Data preview:
                </div>

                <div className="overflow-x-auto rounded-md border border-border scrollbar-thin">
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
                      {parsed.rows.slice((previewPage - 1) * previewLimit, previewPage * previewLimit).map((row, i) => (
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
                
                <Pagination
                  page={previewPage}
                  totalPages={Math.ceil(parsed.rows.length / previewLimit)}
                  limit={previewLimit}
                  total={parsed.rows.length}
                  onPageChange={setPreviewPage}
                  onLimitChange={(l) => { setPreviewLimit(l); setPreviewPage(1); }}
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => { setParsed(null); setStep(0); }}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={missingColumns.length > 0 || rowErrors.length > 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Importing&hellip;
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
