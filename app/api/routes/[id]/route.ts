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
  // it (nullable FK). Detach those (their emissions stay recorded; only the
  // route attribution is cleared), then delete — both org-scoped, in one atomic
  // transaction. deleteMany keeps the delete race-safe: if the route was
  // removed by a concurrent request, count is 0 and we return a stable 404
  // instead of throwing P2025.
  const [, deleted] = await prisma.$transaction([
    prisma.activity.updateMany({
      where: { routeId: id, organizationId: ctx.organizationId },
      data: { routeId: null },
    }),
    prisma.route.deleteMany({ where: { id, organizationId: ctx.organizationId } }),
  ]);

  if (deleted.count === 0) {
    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { id } });
}
