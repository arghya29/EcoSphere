import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { activitiesPayloadSchema } from '@/lib/validations';
import { calculateActivityEmissions } from '@/lib/emissions';
import { findUnauthorizedIds, normalizeOptionalId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '10');
  const offset = parseInt(url.searchParams.get('offset') ?? '0');
  const type = url.searchParams.get('type');
  const startDateStr = url.searchParams.get('startDate');
  const endDateStr = url.searchParams.get('endDate');
  const searchQuery = url.searchParams.get('search')?.trim();

  const where: any = { organizationId: ctx.organizationId };
  if (type && type !== 'ALL') {
    where.type = type;
  }
  if (startDateStr || endDateStr) {
    where.dateRecorded = {};
    if (startDateStr) where.dateRecorded.gte = new Date(startDateStr);
    if (endDateStr) where.dateRecorded.lte = new Date(endDateStr);
  }
  if (searchQuery) {
    where.OR = [
      { factor: { category: { contains: searchQuery, mode: 'insensitive' } } },
      { type: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: { factor: true, supplier: true, facility: true, route: true },
      orderBy: { dateRecorded: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { activities, total } });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or missing activity IDs' }, { status: 400 });
    }

    await prisma.activity.deleteMany({
      where: {
        id: { in: ids },
        organizationId: ctx.organizationId,
      },
    });

    return NextResponse.json({ success: true, message: 'Activities deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete activities' }, { status: 500 });
  }
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
  const [factors, customFactors] = await Promise.all([
    prisma.emissionFactor.findMany({ where: { category: { in: categories } } }),
    prisma.customEmissionFactor.findMany({ where: { category: { in: categories }, organizationId: ctx.organizationId } }),
  ]);
  const factorByCategory = new Map<string, { id: string; value: number }>();
  factors.forEach((f) => factorByCategory.set(f.category, f));
  customFactors.forEach((f) => factorByCategory.set(f.category, f));

  const missing = categories.filter((c) => !factorByCategory.has(c));
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Unknown emission factor categories: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  // Normalize each activity's optional foreign keys: blank/whitespace IDs
  // become undefined so they're treated as "no reference" consistently — both
  // by the ownership check below and by the create payload. Without this a
  // blank "" would skip the ownership check yet still reach Prisma as an
  // invalid foreign key.
  const activities = parsed.data.activities.map((a) => ({
    ...a,
    supplierId: normalizeOptionalId(a.supplierId),
    facilityId: normalizeOptionalId(a.facilityId),
    routeId: normalizeOptionalId(a.routeId),
  }));

  // Verify every referenced supplier/facility/route belongs to the caller's
  // organization before writing. Without this, a signed-in user could attach
  // activities to another org's entities simply by passing their IDs (the
  // README guarantees all data is scoped to the signed-in user's organization).
  // We resolve the owned IDs with one scoped findMany per entity type, then
  // reject any referenced ID that isn't owned — before opening the write
  // transaction. This mirrors the check already performed in /api/upload.
  const supplierIds = Array.from(
    new Set(activities.map((a) => a.supplierId).filter((id): id is string => Boolean(id)))
  );
  const facilityIds = Array.from(
    new Set(activities.map((a) => a.facilityId).filter((id): id is string => Boolean(id)))
  );
  const routeIds = Array.from(
    new Set(activities.map((a) => a.routeId).filter((id): id is string => Boolean(id)))
  );

  const [ownedSuppliers, ownedFacilities, ownedRoutes] = await Promise.all([
    supplierIds.length
      ? prisma.supplier.findMany({
          where: { id: { in: supplierIds }, organizationId: ctx.organizationId },
          select: { id: true },
        })
      : Promise.resolve([]),
    facilityIds.length
      ? prisma.facility.findMany({
          where: { id: { in: facilityIds }, organizationId: ctx.organizationId },
          select: { id: true },
        })
      : Promise.resolve([]),
    routeIds.length
      ? prisma.route.findMany({
          where: { id: { in: routeIds }, organizationId: ctx.organizationId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const unauthorized = [
    ...findUnauthorizedIds(supplierIds, ownedSuppliers.map((s: { id: string }) => s.id)).map((id) => `supplier ${id}`),
    ...findUnauthorizedIds(facilityIds, ownedFacilities.map((f: { id: string }) => f.id)).map((id) => `facility ${id}`),
    ...findUnauthorizedIds(routeIds, ownedRoutes.map((r: { id: string }) => r.id)).map((id) => `route ${id}`),
  ];
  if (unauthorized.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `These referenced entities do not belong to your organization: ${unauthorized.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    activities.map((a) => {
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
