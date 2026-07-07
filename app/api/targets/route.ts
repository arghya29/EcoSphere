import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const targetSchema = z.object({
  scope: z.enum(['SCOPE_1', 'SCOPE_2', 'SCOPE_3']),
  targetValue: z.number().positive(),
  year: z.number().int().min(2020).max(2100),
});

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const targets = await prisma.target.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ year: 'asc' }, { scope: 'asc' }],
  });

  return NextResponse.json({ success: true, data: targets });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const parsed = targetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 }
      );
    }

    // Calculate current emissions for the specified scope and year to populate currentValue
    const startOfYear = new Date(parsed.data.year, 0, 1);
    const endOfYear = new Date(parsed.data.year, 11, 31, 23, 59, 59);

    const activities = await prisma.activity.findMany({
      where: {
        organizationId: ctx.organizationId,
        dateRecorded: {
          gte: startOfYear,
          lte: endOfYear,
        },
        factor: {
          scope: parsed.data.scope,
        },
      },
      select: {
        emissionsKg: true,
      },
    });

    const currentValue = activities.reduce((sum, act) => sum + act.emissionsKg, 0);

    // Get existing target to upsert properly
    const existing = await prisma.target.findFirst({
      where: {
        organizationId: ctx.organizationId,
        scope: parsed.data.scope,
        year: parsed.data.year,
      },
      select: { id: true },
    });

    const target = await prisma.target.upsert({
      where: {
        id: existing?.id ?? 'new-placeholder-id',
      },
      create: {
        organizationId: ctx.organizationId,
        scope: parsed.data.scope,
        targetValue: parsed.data.targetValue,
        currentValue,
        year: parsed.data.year,
      },
      update: {
        targetValue: parsed.data.targetValue,
        currentValue,
      },
    });

    return NextResponse.json({ success: true, data: target }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process target' },
      { status: 500 }
    );
  }
}
