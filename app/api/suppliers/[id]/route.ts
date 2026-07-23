import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { guardNodeDeletion } from '@/lib/builder-delete';
import { logAudit } from '@/lib/audit';

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

  try {
    // Count dependent routes and delete inside one interactive transaction, so
    // the guard can't be raced by a route inserted between the check and the
    // delete. "Blocked" is returned (not thrown), so the read-only path simply
    // commits an empty transaction.
    const result = await prisma.$transaction(async (tx) => {
      // Block if any route still originates from this supplier — deleting it
      // would leave those routes without an origin.
      const dependentRoutes = await tx.route.count({
        where: { originSupplierId: id, organizationId: ctx.organizationId },
      });
      const guard = guardNodeDeletion('supplier', dependentRoutes);
      if (guard.blocked) {
        return { blocked: true as const, error: guard.error };
      }

      // Detach historical activities (their emissions stay recorded; only the
      // supplier attribution is cleared), then delete. deleteMany is org-scoped,
      // so a concurrent removal yields count 0 rather than throwing P2025.
      await tx.activity.updateMany({
        where: { supplierId: id, organizationId: ctx.organizationId },
        data: { supplierId: null },
      });
      const { count } = await tx.supplier.deleteMany({
        where: { id, organizationId: ctx.organizationId },
      });
      return { blocked: false as const, deleted: count };
    });

    if (result.blocked) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }
    if (result.deleted === 0) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    await logAudit({
      actor: ctx.userId,
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
      orgId: ctx.organizationId,
    });

    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    // Concurrency backstop: were a route referencing this supplier created
    // between the in-transaction count and the delete, a required foreign key
    // would reject it (P2003). The supplier's origin FK is nullable today, so
    // this is defensive/future-proof — it maps that race to the same 409.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This supplier is still used by a route. Remove it first, then delete the supplier.',
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
