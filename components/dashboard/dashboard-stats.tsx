import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKg } from '@/lib/utils';
import { TrendIndicator } from '@/components/charts/trend-indicator';
import type { TrendData } from '@/lib/utils/analytics';

export function DashboardStats({
  total,
  scope1,
  scope2,
  scope3,
  trends,
}: {
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
  trends?: {
    total?: TrendData;
    scope1?: TrendData;
    scope2?: TrendData;
    scope3?: TrendData;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm">Total emissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-lg sm:text-2xl font-semibold">{formatKg(total)}</p>
          {trends?.total && (
            <p className="mt-0.5">
              <TrendIndicator trend={trends.total} />
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-scope1" aria-hidden="true" />
            Scope 1
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-lg sm:text-2xl font-semibold">{formatKg(scope1)}</p>
          {trends?.scope1 && (
            <p className="mt-0.5">
              <TrendIndicator trend={trends.scope1} />
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-scope2" aria-hidden="true" />
            Scope 2
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-lg sm:text-2xl font-semibold">{formatKg(scope2)}</p>
          {trends?.scope2 && (
            <p className="mt-0.5">
              <TrendIndicator trend={trends.scope2} />
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-scope3" aria-hidden="true" />
            Scope 3
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-lg sm:text-2xl font-semibold">{formatKg(scope3)}</p>
          {trends?.scope3 && (
            <p className="mt-0.5">
              <TrendIndicator trend={trends.scope3} />
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
