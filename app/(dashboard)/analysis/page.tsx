'use client';

import { useApi } from '@/hooks/use-api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartPie } from '@/components/charts/chart-pie';
import { ChartBar } from '@/components/charts/chart-bar';
import { ChartLine } from '@/components/charts/chart-line';
import { formatKg } from '@/lib/utils';
import type { DashboardSummary } from '@/types/api';

export default function AnalysisPage() {
  const { data: summary, isLoading } = useApi<DashboardSummary>('/api/dashboard');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Emissions analysis</h1>
        <p className="text-sm text-muted-foreground">Breakdown by scope, top emitters, and trend over time.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : summary ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Scope 1 / 2 / 3 breakdown</CardTitle>
                <CardDescription>Share of total emissions by scope.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPie scope1={summary.scope1} scope2={summary.scope2} scope3={summary.scope3} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Emissions over time</CardTitle>
                <CardDescription>Monthly total, all scopes combined.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartLine data={summary.monthlyTrend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Top suppliers</CardTitle>
                <CardDescription>By total associated emissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBar
                  data={summary.topSuppliers.map((s) => ({ name: s.name, emissionsKg: s.emissionsKg }))}
                  title="Suppliers"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Top facilities</CardTitle>
                <CardDescription>By total associated emissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartBar
                  data={summary.topFacilities.map((f) => ({ name: f.name, emissionsKg: f.emissionsKg }))}
                  title="Facilities"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Numeric totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th scope="col" className="py-2 font-medium">Category</th>
                      <th scope="col" className="py-2 font-medium">Emissions (CO₂e)</th>
                      <th scope="col" className="py-2 font-medium">Share of total</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-data">
                    {[
                      { label: 'Scope 1', value: summary.scope1 },
                      { label: 'Scope 2', value: summary.scope2 },
                      { label: 'Scope 3', value: summary.scope3 },
                      { label: 'Total', value: summary.total },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-border last:border-0">
                        <td className="py-2 font-sans">{row.label}</td>
                        <td className="py-2">{formatKg(row.value)}</td>
                        <td className="py-2">
                          {summary.total > 0 ? `${Math.round((row.value / summary.total) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
