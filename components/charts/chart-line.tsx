'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatKg } from '@/lib/utils';
import { EmptyChart } from './chart-pie';

export function ChartLine({ data }: { data: { month: string; emissionsKg: number }[] }) {
  if (data.length < 2) {
    return <EmptyChart message="Need at least two months of data to show a trend." />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis
            tickFormatter={(v) => formatKg(v)}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <Tooltip formatter={(value: number) => formatKg(value)} />
          <Line
            type="monotone"
            dataKey="emissionsKg"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot
            name="Emissions"
          />
        </LineChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Monthly emissions trend</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Emissions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{formatKg(d.emissionsKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
