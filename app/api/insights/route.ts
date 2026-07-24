import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { aggregateByScope, aggregateByEntity } from '@/lib/emissions';
import { generateInsights } from '@/lib/insights';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const [activities, suppliers, facilities, routes] = await Promise.all([
    prisma.activity.findMany({
      where: { organizationId: ctx.organizationId },
      include: { factor: true },
    }),
    prisma.supplier.findMany({ where: { organizationId: ctx.organizationId } }),
    prisma.facility.findMany({ where: { organizationId: ctx.organizationId } }),
    prisma.route.findMany({ where: { organizationId: ctx.organizationId } }),
  ]);

  const scopes = aggregateByScope(activities);
  const topSuppliers = aggregateByEntity(activities, 'supplier', suppliers);
  const topFacilities = aggregateByEntity(activities, 'facility', facilities);
  const routeEmissions = aggregateByEntity(
    activities,
    'route',
    routes.map((r) => ({ id: r.id, name: `Route ${r.id.slice(0, 6)} (${r.mode})` }))
  ).map((re) => {
    const route = routes.find((r) => r.id === re.id);
    return { ...re, mode: route?.mode ?? 'OTHER' } as const;
  });

  const insights = generateInsights({
    scopes,
    topSuppliers,
    topFacilities,
    routes: routeEmissions as Parameters<typeof generateInsights>[0]['routes'],
  });

  return NextResponse.json({ success: true, data: { insights } });
}
