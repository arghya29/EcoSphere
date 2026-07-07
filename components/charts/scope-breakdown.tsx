'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { toScopeBreakdownData } from '@/lib/utils/chart-helpers';

interface ScopeBreakdownProps {
  scope1: number;
  scope2: number;
  scope3: number;
}

export function ScopeBreakdown({ scope1, scope2, scope3 }: ScopeBreakdownProps) {
  const data = toScopeBreakdownData({ scope1, scope2, scope3 });

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
        No emissions data recorded yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} kg CO₂e`, 'Emissions']}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Legend layout="horizontal" align="center" verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

