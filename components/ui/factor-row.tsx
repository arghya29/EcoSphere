'use client';

import * as React from 'react';
import { Trash2, Edit3, CornerUpRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface FactorItem {
  id: string;
  category: string;
  scope: 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
  value: number;
  unit: string;
  source?: string | null;
  isCustom?: boolean;
  isOverridden?: boolean;
  overrideFactor?: FactorItem;
}

interface FactorRowProps {
  factor: FactorItem;
  onDelete?: (id: string, category: string) => void;
  onEdit?: (factor: FactorItem) => void;
  onOverride?: (factor: FactorItem) => void;
}

export function FactorRow({ factor, onDelete, onEdit, onOverride }: FactorRowProps) {
  const scopeColors = {
    SCOPE_1: 'bg-scope1 text-white border-transparent',
    SCOPE_2: 'bg-scope2 text-white border-transparent',
    SCOPE_3: 'bg-scope3 text-white border-transparent',
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:shadow-sm bg-card transition-shadow gap-3 ${
        factor.isCustom ? 'border-primary/30 bg-primary/5' : ''
      }`}
    >
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm truncate">{factor.category}</span>

          <Badge className={scopeColors[factor.scope]}>{factor.scope.replace('_', ' ')}</Badge>

          {factor.isCustom ? (
            <Badge
              variant="outline"
              className="border-primary text-primary bg-primary/10 flex items-center gap-1"
            >
              <UserCheck className="h-3 w-3" />
              Custom
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              System
            </Badge>
          )}

          {factor.isOverridden && (
            <Badge
              variant="outline"
              className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[10px]"
            >
              Overridden
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>
            Value:{' '}
            <span
              className={`font-semibold ${factor.isOverridden ? 'line-through text-muted-foreground/70' : 'text-foreground'}`}
            >
              {factor.value}
            </span>{' '}
            kg CO₂e / {factor.unit}
            {factor.source && ` | Source: ${factor.source}`}
          </p>

          {factor.isOverridden && factor.overrideFactor && (
            <p className="text-primary font-medium flex items-center gap-1">
              <CornerUpRight className="h-3.5 w-3.5" />
              Active Custom Override: {factor.overrideFactor.value} kg CO₂e /{' '}
              {factor.overrideFactor.unit}
              {factor.overrideFactor.source && ` (${factor.overrideFactor.source})`}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {factor.isCustom ? (
          <>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(factor)}
                className="h-8 px-2.5 text-xs flex items-center gap-1"
                aria-label={`Edit custom factor ${factor.category}`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(factor.id, factor.category)}
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30 flex items-center gap-1"
                aria-label={`Delete custom factor ${factor.category}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </>
        ) : (
          onOverride && (
            <Button
              variant={factor.isOverridden ? 'outline' : 'default'}
              size="sm"
              onClick={() =>
                onOverride(
                  factor.isOverridden && factor.overrideFactor ? factor.overrideFactor : factor
                )
              }
              className="h-8 px-2.5 text-xs flex items-center gap-1"
            >
              <CornerUpRight className="h-3.5 w-3.5" />
              {factor.isOverridden ? 'Edit Override' : 'Override Factor'}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
