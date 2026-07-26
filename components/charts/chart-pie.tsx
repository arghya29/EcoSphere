'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatKg } from '@/lib/utils';

interface ScopeDatum {
  name: string;
  value: number;
  color: string;
}

export function ChartPie({
  scope1,
  scope2,
  scope3,
}: {
  scope1: number;
  scope2: number;
  scope3: number;
}) {
  const data: ScopeDatum[] = [
    { name: 'Scope 1', value: scope1, color: 'hsl(var(--scope1))' },
    { name: 'Scope 2', value: scope2, color: 'hsl(var(--scope2))' },
    { name: 'Scope 3', value: scope3, color: 'hsl(var(--scope3))' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <EmptyChart message="No emissions recorded yet." />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => formatKg(entry.value)}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatKg(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {/* Accessible textual summary alongside the visual chart */}
      <table className="sr-only">
        <caption>Emissions breakdown by scope</caption>
        <thead>
          <tr>
            <th scope="col">Scope</th>
            <th scope="col">Emissions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td>{formatKg(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
