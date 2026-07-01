import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const { id } = params;

  const route = await prisma.route.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!route) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }

  // Nothing structural references a route; only historical activities point at
  // it. Detach those (their emissions stay recorded; only the route
  // attribution is cleared), then delete — atomically. A route therefore has
  // no dependents that can block its removal.
  await prisma.$transaction([
    prisma.activity.updateMany({
      where: { routeId: id, organizationId: ctx.organizationId },
      data: { routeId: null },
    }),
    prisma.route.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true, data: { id } });
}
