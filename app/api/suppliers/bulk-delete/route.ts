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
  const owned = await prisma.supplier.findMany({
    where: { id: { in: ids }, organizationId: ctx.organizationId },
    select: { id: true },
  });
  const ownedIds = owned.map((s) => s.id);
  if (ownedIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No matching suppliers found' },
      { status: 404 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Block if any of the selected suppliers still has dependent routes. A
      // supplier can be an optional origin for a route; removing it would leave
      // those routes without an origin.
      const dependentRouteCount = await tx.route.count({
        where: {
          originSupplierId: { in: ownedIds },
          organizationId: ctx.organizationId,
        },
      });

      if (dependentRouteCount > 0) {
        const routeWord = dependentRouteCount === 1 ? 'route' : 'routes';
        return {
          blocked: true as const,
          error: `${dependentRouteCount} ${routeWord} still reference one or more of these suppliers. Remove those routes first, then delete the suppliers.`,
        };
      }

      // Detach historical activities (emissions are preserved; only the supplier
      // attribution is cleared) before bulk-deleting.
      await tx.activity.updateMany({
        where: { supplierId: { in: ownedIds }, organizationId: ctx.organizationId },
        data: { supplierId: null },
      });

      const { count } = await tx.supplier.deleteMany({
        where: { id: { in: ownedIds }, organizationId: ctx.organizationId },
      });

      return { blocked: false as const, deleted: count };
    });

    if (result.blocked) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: { deleted: result.deleted } });
  } catch (err) {
    // Concurrency backstop: if a route referencing one of these suppliers was
    // created between the in-transaction count and the deleteMany, the FK is
    // nullable so no P2003 would fire — but guard defensively anyway.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more suppliers are still used by a route. Remove those routes first.',
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
