import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { routesPayloadSchema } from '@/lib/validations';
import { findUnauthorizedIds, normalizeOptionalId } from '@/lib/utils';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const routes = await prisma.route.findMany({
    where: { organizationId: ctx.organizationId },
    include: { originSupplier: true, originFacility: true, destination: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: routes });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json();
  const parsed = routesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  // Normalize optional origin IDs (blank/whitespace -> undefined) and trim the
  // required destination ID, so blank values are handled consistently by the
  // presence check, the ownership check, and the write.
  const routes = parsed.data.routes.map((r) => ({
    ...r,
    originSupplierId: normalizeOptionalId(r.originSupplierId),
    originFacilityId: normalizeOptionalId(r.originFacilityId),
    destinationId: r.destinationId.trim(),
  }));

  for (const r of routes) {
    if (!r.originSupplierId && !r.originFacilityId) {
      return NextResponse.json(
        { success: false, error: 'Each route needs an originSupplierId or originFacilityId.' },
        { status: 400 }
      );
    }
  }

  // Verify every referenced entity belongs to the caller's organization before
  // writing. originSupplierId references a Supplier; originFacilityId and the
  // required destinationId both reference a Facility. Without this check, a
  // signed-in user could point a route at another org's supplier/facility by
  // passing its ID. This mirrors the check already performed in /api/upload.
  const supplierIds = Array.from(
    new Set(routes.map((r) => r.originSupplierId).filter((id): id is string => Boolean(id)))
  );
  const facilityIds = Array.from(
    new Set(
      routes
        .flatMap((r) => [r.originFacilityId, r.destinationId])
        .filter((id): id is string => Boolean(id))
    )
  );

  const [ownedSuppliers, ownedFacilities] = await Promise.all([
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
  ]);

  const unauthorized = [
    ...findUnauthorizedIds(supplierIds, ownedSuppliers.map((s: { id: string }) => s.id)).map((id) => `supplier ${id}`),
    ...findUnauthorizedIds(facilityIds, ownedFacilities.map((f: { id: string }) => f.id)).map((id) => `facility ${id}`),
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
    routes.map((r) =>
      prisma.route.create({
        data: { ...r, organizationId: ctx.organizationId },
      })
    )
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
