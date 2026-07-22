import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const factorSchema = z.object({
  category: z.string().min(1).max(50),
  scope: z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3']),
  value: z.number().positive(),
  unit: z.string().min(1).max(20),
  source: z.string().max(100).optional(),
});

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const customFactors = await prisma.customEmissionFactor.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { category: 'asc' },
  });

  return NextResponse.json({ success: true, data: customFactors });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const parsed = factorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 }
      );
    }

    const existing = await prisma.customEmissionFactor.findFirst({
      where: {
        organizationId: ctx.organizationId,
        category: parsed.data.category,
      },
      select: { id: true },
    });

    const factor = await prisma.customEmissionFactor.upsert({
      where: {
        id: existing?.id ?? 'new-factor-id',
      },
      create: {
        organizationId: ctx.organizationId,
        category: parsed.data.category,
        scope: parsed.data.scope,
        value: parsed.data.value,
        unit: parsed.data.unit,
        source: parsed.data.source,
      },
      update: {
        scope: parsed.data.scope,
        value: parsed.data.value,
        unit: parsed.data.unit,
        source: parsed.data.source,
      },
    });

    return NextResponse.json({ success: true, data: factor }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save custom emission factor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing factor ID' }, { status: 400 });
    }

    const factor = await prisma.customEmissionFactor.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!factor) {
      return NextResponse.json({ success: false, error: 'Factor not found or unauthorized' }, { status: 404 });
    }

    await prisma.customEmissionFactor.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Factor deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete factor' }, { status: 500 });
  }
}
