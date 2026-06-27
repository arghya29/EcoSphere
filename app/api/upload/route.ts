import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';
import { calculateActivityEmissions, deriveActivityType } from '@/lib/emissions';

// Accepts already-parsed rows (the client parses CSV/XLSX with
// PapaParse/SheetJS per the spec, then POSTs structured JSON here).
// `kind` tells us which table the rows belong to.
const uploadSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('suppliers'),
    rows: z.array(
      z.object({
        name: z.string().min(1),
        location: z.string().optional(),
        category: z.string().optional(),
        latitude: z.coerce.number().optional(),
        longitude: z.coerce.number().optional(),
      })
    ),
  }),
  z.object({
    kind: z.literal('facilities'),
    rows: z.array(
      z.object({
        name: z.string().min(1),
        type: z.string().optional(),
        location: z.string().optional(),
        latitude: z.coerce.number().optional(),
        longitude: z.coerce.number().optional(),
      })
    ),
  }),
  z.object({
    kind: z.literal('activities'),
    rows: z.array(
      z.object({
        facility_id: z.string().optional(),
        route_id: z.string().optional(),
        supplier_id: z.string().optional(),
        factor_category: z.string().min(1),
        amount: z.coerce.number().positive(),
        unit: z.string().min(1),
        date: z.coerce.date(),
      })
    ),
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

  const created = await prisma.$transaction(
    parsed.data.rows.map((r) => {
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
