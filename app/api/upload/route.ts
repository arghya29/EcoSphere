import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';
import { calculateActivityEmissions, deriveActivityType } from '@/lib/emissions';
import { findUnauthorizedIds, normalizeOptionalId } from '@/lib/utils';

// Cap the number of rows accepted in a single bulk upload. Without an upper
// bound, a large payload is turned into one prisma.$transaction with one
// create() per row, which can exhaust memory and hold DB locks for a long time
// — a denial-of-service vector. Oversized uploads are rejected by validation
// before any database work begins; clients should split large files into
// batches under this limit.
const MAX_UPLOAD_ROWS = 1000;

const tooManyRowsMessage = `Too many rows in a single upload (maximum ${MAX_UPLOAD_ROWS}). Split the file into smaller batches.`;

// Accepts already-parsed rows (the client parses CSV/XLSX with
// PapaParse/SheetJS per the spec, then POSTs structured JSON here).
// `kind` tells us which table the rows belong to.
const uploadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('suppliers'),
    rows: z
      .array(
        z.object({
          name: z.string().min(1),
          location: z.string().optional(),
          category: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
  z.object({
    kind: z.literal('facilities'),
    rows: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.string().optional(),
          location: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
  z.object({
    kind: z.literal('activities'),
    rows: z
      .array(
        z.object({
          facility_id: z.string().nullish(),
          route_id: z.string().nullish(),
          supplier_id: z.string().nullish(),
          factor_category: z.string().min(1),
          amount: z.coerce.number().positive(),
          unit: z.string().min(1),
          date: z.coerce.date(),
        })
      )
      .max(MAX_UPLOAD_ROWS, { message: tooManyRowsMessage }),
  }),
]);

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid upload payload' },
      { status: 400 }
    );
  }

  if (parsed.data.kind === 'suppliers') {
    const created = await prisma.$transaction(
      parsed.data.rows.map((r) =>
        prisma.supplier.create({ data: { ...r, organizationId: ctx.organizationId } })
      )
    );
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  }

  if (parsed.data.kind === 'facilities') {
    const created = await prisma.$transaction(
      parsed.data.rows.map((r) =>
        prisma.facility.create({ data: { ...r, organizationId: ctx.organizationId } })
      )
    );
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  }

  // activities
  const categories = Array.from(new Set(parsed.data.rows.map((r) => r.factor_category)));
  const factors = await prisma.emissionFactor.findMany({ where: { category: { in: categories } } });
  const factorByCategory = new Map(factors.map((f) => [f.category, f]));
  const missing = categories.filter((c) => !factorByCategory.has(c));
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Unknown emission factor categories: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  // Normalize each row's optional foreign keys up front: blank/whitespace IDs
  // become undefined so they're treated as "no reference" consistently — both
  // by the ownership check below and by the create payload. Without this a
  // blank "" would skip the ownership check yet still reach Prisma as an
  // invalid foreign key.
  const rows = parsed.data.rows.map((r) => ({
    ...r,
    facility_id: normalizeOptionalId(r.facility_id),
    route_id: normalizeOptionalId(r.route_id),
    supplier_id: normalizeOptionalId(r.supplier_id),
  }));

  // Verify every referenced facility/route/supplier belongs to the caller's
  // organization. Without this, a signed-in user could attach activities to
  // another org's entities by passing their IDs (the README guarantees all
  // routes are scoped to the signed-in user's organization). We resolve the
  // owned IDs with one scoped findMany per entity type, then reject any
  // referenced ID that isn't owned — before opening the write transaction.
  const facilityIds = Array.from(
    new Set(rows.map((r) => r.facility_id).filter((id): id is string => Boolean(id)))
  );
  const routeIds = Array.from(
    new Set(rows.map((r) => r.route_id).filter((id): id is string => Boolean(id)))
  );
  const supplierIds = Array.from(
    new Set(rows.map((r) => r.supplier_id).filter((id): id is string => Boolean(id)))
  );

  const [ownedFacilities, ownedRoutes, ownedSuppliers] = await Promise.all([
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
    supplierIds.length
      ? prisma.supplier.findMany({
          where: { id: { in: supplierIds }, organizationId: ctx.organizationId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const unauthorized = [
    ...findUnauthorizedIds(facilityIds, ownedFacilities.map((f: { id: string }) => f.id)).map((id) => `facility ${id}`),
    ...findUnauthorizedIds(routeIds, ownedRoutes.map((r: { id: string }) => r.id)).map((id) => `route ${id}`),
    ...findUnauthorizedIds(supplierIds, ownedSuppliers.map((s: { id: string }) => s.id)).map((id) => `supplier ${id}`),
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
    rows.map((r) => {
      const factor = factorByCategory.get(r.factor_category)!;
      const emissionsKg = calculateActivityEmissions(r.amount, factor.value);
      return prisma.activity.create({
        data: {
          organizationId: ctx.organizationId,
          type: deriveActivityType(factor.category, Boolean(r.route_id)),
          facilityId: r.facility_id,
          routeId: r.route_id,
          supplierId: r.supplier_id,
          amount: r.amount,
          unit: r.unit,
          factorId: factor.id,
          emissionsKg,
          dateRecorded: r.date,
        },
      });
    })
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
