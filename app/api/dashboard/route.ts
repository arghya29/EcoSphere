import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { aggregateByScope, aggregateByEntity, aggregateByMonth } from '@/lib/emissions';

async function computePreviousPeriodScopes(organizationId: string, currentMonths: string[]) {
  if (currentMonths.length < 1) return null;

  const sorted = [...currentMonths].sort();
  const earliestMonth = sorted[0];
  const [yearStr, monthStr] = earliestMonth.split('-');
  const earliestDate = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  const prevEnd = new Date(earliestDate);
  prevEnd.setDate(0);
  const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);

  const prevActivities = await prisma.activity.findMany({
    where: {
      organizationId,
      dateRecorded: {
        gte: prevStart.toISOString(),
        lt: earliestDate.toISOString(),
      },
    },
    include: { factor: true },
  });

  if (prevActivities.length === 0) return null;
  return aggregateByScope(prevActivities);
}

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
  const previousScopes = await computePreviousPeriodScopes(
    ctx.organizationId,
    monthlyTrend.map((m) => m.month)
  );

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
      previousTotal: previousScopes?.total ?? null,
      previousScope1: previousScopes?.scope1 ?? null,
      previousScope2: previousScopes?.scope2 ?? null,
      previousScope3: previousScopes?.scope3 ?? null,
    },
  });
}
