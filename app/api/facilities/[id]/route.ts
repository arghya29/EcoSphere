import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { guardNodeDeletion } from '@/lib/builder-delete';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const { id } = params;

  const facility = await prisma.facility.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!facility) {
    return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 });
  }

  try {
    // Count dependent routes and delete inside one interactive transaction, so
    // the guard can't be raced by a route inserted between the check and the
    // delete. "Blocked" is returned (not thrown), so the read-only path simply
    // commits an empty transaction.
    const result = await prisma.$transaction(async (tx) => {
      // A facility can be a route's origin (optional FK) or its destination
      // (required FK). Either way a dependent route must be removed first: for
      // the destination case the database's required foreign key would reject
      // the delete outright; for the origin case it would leave the route
      // without an origin. Count both and block if any exist.
      const dependentRoutes = await tx.route.count({
        where: {
          organizationId: ctx.organizationId,
          OR: [{ destinationId: id }, { originFacilityId: id }],
        },
      });
      const guard = guardNodeDeletion('facility', dependentRoutes);
      if (guard.blocked) {
        return { blocked: true as const, error: guard.error };
      }

      // Detach historical activities (their emissions stay recorded; only the
      // facility attribution is cleared), then delete. deleteMany is org-scoped,
      // so a concurrent removal yields count 0 rather than throwing P2025.
      await tx.activity.updateMany({
        where: { facilityId: id, organizationId: ctx.organizationId },
        data: { facilityId: null },
      });
      const { count } = await tx.facility.deleteMany({
        where: { id, organizationId: ctx.organizationId },
      });
      return { blocked: false as const, deleted: count };
    });

    if (result.blocked) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }
    if (result.deleted === 0) {
      return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { id } });
  } catch (err) {
    // Concurrency backstop: if a route referencing this facility as its required
    // destination is created between the in-transaction count and the delete,
    // the destination foreign key rejects the delete (P2003). Map that race to
    // the same 409 the guard would have returned.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'This facility is still used by a route. Remove it first, then delete the facility.',
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
