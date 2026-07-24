'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatKg } from '@/lib/utils';
import { EmptyChart } from './chart-pie';

export function ChartBar({
  data,
  title,
}: {
  data: { name: string; emissionsKg: number }[];
  title: string;
}) {
  if (data.length === 0) {
    return <EmptyChart message={`No ${title.toLowerCase()} data yet.`} />;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 24, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tickFormatter={(v) => formatKg(v)}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <Tooltip formatter={(value: number) => formatKg(value)} />
          <Bar
            dataKey="emissionsKg"
            fill="hsl(var(--scope3))"
            radius={[0, 4, 4, 0]}
            name="Emissions"
          />
        </BarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>{title} by emissions</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Emissions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td>{formatKg(d.emissionsKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
