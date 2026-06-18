import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { routesPayloadSchema } from '@/lib/validations';

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

  for (const r of parsed.data.routes) {
    if (!r.originSupplierId && !r.originFacilityId) {
      return NextResponse.json(
        { success: false, error: 'Each route needs an originSupplierId or originFacilityId.' },
        { status: 400 }
      );
    }
  }

  const created = await prisma.$transaction(
    parsed.data.routes.map((r) =>
      prisma.route.create({
        data: { ...r, organizationId: ctx.organizationId },
      })
    )
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
