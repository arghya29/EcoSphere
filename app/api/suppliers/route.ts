import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { suppliersPayloadSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: suppliers });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json();
  const parsed = suppliersPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    parsed.data.suppliers.map((s) =>
      prisma.supplier.create({
        data: { ...s, organizationId: ctx.organizationId },
      })
    )
  );

  for (const supplier of created) {
    await logAudit({
      actor: ctx.userId,
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      orgId: ctx.organizationId,
      metadata: { name: supplier.name, category: supplier.category, location: supplier.location },
    });
  }

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
