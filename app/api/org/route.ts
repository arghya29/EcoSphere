import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const org = await prisma.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { id: true, name: true, region: true, createdAt: true },
  });

  if (!org) {
    return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: org });
}

export async function PUT(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const { name, region } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Organization name cannot be empty' },
        { status: 400 }
      );
    }

    if (region !== undefined && typeof region !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Region must be a string' },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(region !== undefined ? { region: region.trim() || null } : {}),
      },
      select: { id: true, name: true, region: true, createdAt: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update organization profile' },
      { status: 500 }
    );
  }
}
