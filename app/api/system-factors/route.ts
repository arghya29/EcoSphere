import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const systemFactors = await prisma.emissionFactor.findMany({
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ success: true, data: systemFactors });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch system emission factors' },
      { status: 500 }
    );
  }
}
