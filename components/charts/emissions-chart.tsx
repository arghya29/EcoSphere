'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TrendData {
  month: string;
  emissions: number;
  target?: number;
}

export function EmissionsChart({ data }: { data: TrendData[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" stroke="hsl(var(--muted-foreground))" />
          <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" unit=" kg" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Legend className="text-xs" />
          <Bar
            dataKey="emissions"
            name="Emissions"
            fill="var(--color-scope3, #3b82f6)"
            radius={[4, 4, 0, 0]}
          />
          {data.some((d) => d.target !== undefined) && (
            <Line
              type="monotone"
              dataKey="target"
              name="Reduction Target"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
