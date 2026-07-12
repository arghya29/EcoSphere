'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CustomFactor {
  id: string;
  category: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  value: number;
  unit: string;
  source?: string | null;
}

export function FactorRow({
  factor,
  onDelete,
}: {
  factor: CustomFactor;
  onDelete: (id: string) => void;
}) {
  const scopeColors = {
    SCOPE_1: 'bg-scope1 text-white border-transparent',
    SCOPE_2: 'bg-scope2 text-white border-transparent',
    SCOPE_3: 'bg-scope3 text-white border-transparent',
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm bg-card transition-shadow">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{factor.category}</span>
          <Badge className={scopeColors[factor.scope]}>
            {factor.scope.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Value: <span className="font-medium text-foreground">{factor.value}</span> kg CO₂e / {factor.unit}
          {factor.source && ` | Source: ${factor.source}`}
        </p>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDelete(factor.id)}
        className="text-destructive hover:bg-destructive/10"
        aria-label={`Delete custom factor ${factor.category}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
