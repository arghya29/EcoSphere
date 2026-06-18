import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { facilitiesPayloadSchema } from '@/lib/validations';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const facilities = await prisma.facility.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: facilities });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json();
  const parsed = facilitiesPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const created = await prisma.$transaction(
    parsed.data.facilities.map((f) =>
      prisma.facility.create({
        data: { ...f, organizationId: ctx.organizationId },
      })
    )
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
