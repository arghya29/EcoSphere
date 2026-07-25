import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, 'At least one ID is required')
    .max(1000, 'Cannot delete more than 1000 items at a time'),
});

export async function DELETE(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const body = await req.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const { ids } = parsed.data;

  // Org-scoped existence check: only operate on IDs that belong to this org.
  const owned = await prisma.facility.findMany({
    where: { id: { in: ids }, organizationId: ctx.organizationId },
    select: { id: true },
  });
  const ownedIds = owned.map((f) => f.id);
  if (ownedIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No matching facilities found' },
      { status: 404 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // A facility can be a route's optional origin (originFacilityId) or its
      // required destination (destinationId). Either way a dependent route must
      // be removed first: deleting the destination facility would be rejected by
      // the DB's required FK; deleting an origin facility leaves the route
      // without an origin.
      const dependentRouteCount = await tx.route.count({
        where: {
          organizationId: ctx.organizationId,
          OR: [{ destinationId: { in: ownedIds } }, { originFacilityId: { in: ownedIds } }],
        },
      });

      if (dependentRouteCount > 0) {
        const routeWord = dependentRouteCount === 1 ? 'route' : 'routes';
        return {
          blocked: true as const,
          error: `${dependentRouteCount} ${routeWord} still reference one or more of these facilities. Remove those routes first, then delete the facilities.`,
        };
      }

      // Detach historical activities before bulk-deleting.
      await tx.activity.updateMany({
        where: { facilityId: { in: ownedIds }, organizationId: ctx.organizationId },
        data: { facilityId: null },
      });

      const { count } = await tx.facility.deleteMany({
        where: { id: { in: ownedIds }, organizationId: ctx.organizationId },
      });

      return { blocked: false as const, deleted: count };
    });

    if (result.blocked) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: { deleted: result.deleted } });
  } catch (err) {
    // If a route referencing one of these facilities as its required destination
    // is created between the count and the deleteMany, the DB rejects the
    // delete with P2003. Map that race to the same 409.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more facilities are still used by a route. Remove those routes first.',
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
