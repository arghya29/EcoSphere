'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export type PageSize = number;

interface PaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const startRange = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border mt-2">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{startRange}</span> to{' '}
        <span className="font-semibold text-foreground">{endRange}</span> of{' '}
        <span className="font-semibold text-foreground">{total}</span> results
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={String(limit)} onValueChange={(val) => onLimitChange(Number(val))}>
            <SelectTrigger className="w-[70px] h-8 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm font-medium text-foreground">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
