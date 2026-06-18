import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { aggregateByScope, aggregateByEntity, aggregateByMonth } from '@/lib/emissions';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const [activities, suppliers, facilities] = await Promise.all([
    prisma.activity.findMany({
      where: { organizationId: ctx.organizationId },
      include: { factor: true },
    }),
    prisma.supplier.findMany({ where: { organizationId: ctx.organizationId } }),
    prisma.facility.findMany({ where: { organizationId: ctx.organizationId } }),
  ]);

  const scopes = aggregateByScope(activities);
  const topSuppliers = aggregateByEntity(activities, 'supplier', suppliers);
  const topFacilities = aggregateByEntity(activities, 'facility', facilities);
  const monthlyTrend = aggregateByMonth(activities);

  return NextResponse.json({
    success: true,
    data: {
      total: scopes.total,
      scope1: scopes.scope1,
      scope2: scopes.scope2,
      scope3: scopes.scope3,
      topSuppliers: topSuppliers.slice(0, 5),
      topFacilities: topFacilities.slice(0, 5),
      monthlyTrend,
      activityCount: activities.length,
      supplierCount: suppliers.length,
      facilityCount: facilities.length,
    },
  });
}
