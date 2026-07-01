import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { guardNodeDeletion } from '@/lib/builder-delete';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const { id } = params;

  // Org-scoped existence check: an id from another org (or one that doesn't
  // exist) returns 404, so ids can't be probed across organizations. Mirrors
  // the ownership posture used elsewhere in the API.
  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!supplier) {
    return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
  }

  // Block if any route still originates from this supplier — deleting it would
  // leave those routes without an origin. The user must remove them first.
  const dependentRoutes = await prisma.route.count({
    where: { originSupplierId: id, organizationId: ctx.organizationId },
  });
  const guard = guardNodeDeletion('supplier', dependentRoutes);
  if (guard.blocked) {
    return NextResponse.json({ success: false, error: guard.error }, { status: 409 });
  }

  // No dependent routes: detach this supplier from any historical activities
  // (their emissions stay recorded; only the supplier attribution is cleared),
  // then delete — atomically, so we never leave a half-applied state.
  await prisma.$transaction([
    prisma.activity.updateMany({
      where: { supplierId: id, organizationId: ctx.organizationId },
      data: { supplierId: null },
    }),
    prisma.supplier.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true, data: { id } });
}
