import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { activitiesPayloadSchema } from '@/lib/validations';
import { calculateActivityEmissions } from '@/lib/emissions';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const activities = await prisma.activity.findMany({
    where: { organizationId: ctx.organizationId },
    include: { factor: true, supplier: true, facility: true, route: true },
    orderBy: { dateRecorded: 'desc' },
  });

  return NextResponse.json({ success: true, data: activities });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json();
  const parsed = activitiesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  // Resolve factor categories -> factor rows up front so we can compute
  // emissions = amount * factor.value before persisting (per spec).
  const categories = Array.from(new Set(parsed.data.activities.map((a) => a.factorCategory)));
  const factors = await prisma.emissionFactor.findMany({ where: { category: { in: categories } } });
  const factorByCategory = new Map(factors.map((f) => [f.category, f]));

  const missing = categories.filter((c) => !factorByCategory.has(c));
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Unknown emission factor categories: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    parsed.data.activities.map((a) => {
      const factor = factorByCategory.get(a.factorCategory)!;
      const emissionsKg = calculateActivityEmissions(a.amount, factor.value);
      return prisma.activity.create({
        data: {
          organizationId: ctx.organizationId,
          type: a.type,
          supplierId: a.supplierId,
          facilityId: a.facilityId,
          routeId: a.routeId,
          amount: a.amount,
          unit: a.unit,
          factorId: factor.id,
          emissionsKg,
          dateRecorded: a.dateRecorded,
        },
      });
    })
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
