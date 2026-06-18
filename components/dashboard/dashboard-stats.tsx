import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKg } from '@/lib/utils';

export function DashboardStats({
  total,
  scope1,
  scope2,
  scope3,
}: {
  total: number;
  scope1: number;
  scope2: number;
  scope3: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Total emissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-2xl font-semibold">{formatKg(total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-scope1" aria-hidden="true" />
            Scope 1
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-2xl font-semibold">{formatKg(scope1)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-scope2" aria-hidden="true" />
            Scope 2
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-2xl font-semibold">{formatKg(scope2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-scope3" aria-hidden="true" />
            Scope 3
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="font-mono-data text-2xl font-semibold">{formatKg(scope3)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
