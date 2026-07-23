'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';

interface TargetProps {
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  targetValue: number;
  currentValue: number;
  year: number;
}

export function TargetCard({ scope, targetValue, currentValue, year }: TargetProps) {
  const percent = Math.min(100, Math.round((currentValue / targetValue) * 100));
  const isOver = currentValue > targetValue;

  const scopeLabels = {
    SCOPE_1: 'Scope 1 (Direct)',
    SCOPE_2: 'Scope 2 (Indirect Grid)',
    SCOPE_3: 'Scope 3 (Supply Chain)',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-semibold">{scopeLabels[scope]}</CardTitle>
        <Badge
          variant={isOver ? 'default' : 'outline'}
          className={
            isOver
              ? 'bg-red-600 text-white hover:bg-red-700 border-transparent'
              : percent > 85
                ? 'bg-amber-500 text-white border-transparent'
                : ''
          }
        >
          {year} Target
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-muted-foreground">Current / Target</span>
          <span className="font-medium text-foreground">
            {Math.round(currentValue).toLocaleString()} / {Math.round(targetValue).toLocaleString()}{' '}
            kg CO₂e
          </span>
        </div>
        <ProgressBar value={percent} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percent}% of limit reached</span>
          {isOver && (
            <span className="text-destructive font-semibold">
              Exceeded by {(currentValue - targetValue).toFixed(0)} kg
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
