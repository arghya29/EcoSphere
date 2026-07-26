'use client';

import * as React from 'react';
import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/skeleton';

interface RiskResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendations: string[];
}

export function RiskPanel() {
  const { data: risk, isLoading, error } = useApi<RiskResult>('/api/risk');

  if (isLoading) return <SkeletonCard className="h-64" />;
  if (error || !risk) return null;

  const scoreColor = {
    LOW: 'text-green-500 border-green-500',
    MEDIUM: 'text-amber-500 border-amber-500',
    HIGH: 'text-red-500 border-red-500',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Carbon Footprint Risk Assessment
        </CardTitle>
        <CardDescription>
          Calculated based on logistical intensity, grid dependencies, and shipping footprint
          ratios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-muted border">
          <div
            className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center font-mono ${scoreColor[risk.level]}`}
          >
            <span className="text-2xl font-bold">{risk.score}</span>
            <span className="text-xs font-semibold">{risk.level}</span>
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm">Carbon Intensity Risk Level: {risk.level}</h4>
            <p className="text-xs text-muted-foreground">
              A higher score indicates high dependency on high-emission shipping (air freight) or
              high-intensity electricity grids.
            </p>
          </div>
        </div>

        {risk.flags.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Risk Flags Identified
            </h5>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              {risk.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h5 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Strategic Decarbonization Actions
          </h5>
          {risk.recommendations.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded bg-green-500/10 text-green-600 text-xs font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Great job! No urgent decarbonization actions recommended.</span>
            </div>
          ) : (
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              {risk.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
