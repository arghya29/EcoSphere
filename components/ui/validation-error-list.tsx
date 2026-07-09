'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ValidationError } from '@/lib/csv-parser';

export function ValidationErrorList({ errors }: { errors: ValidationError[] }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20 text-sm text-destructive max-h-48 overflow-y-auto space-y-2">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Validation failed ({errors.length} errors found):</span>
      </div>
      <ul className="list-disc pl-5 space-y-1 text-xs">
        {errors.slice(0, 50).map((err, idx) => (
          <li key={idx}>
            <span className="font-semibold">{err.column}:</span> {err.message}
          </li>
        ))}
        {errors.length > 50 && (
          <li className="font-semibold list-none pl-0 pt-1 text-muted-foreground">
            ... and {errors.length - 50} more errors
          </li>
        )}
      </ul>
    </div>
  );
}
