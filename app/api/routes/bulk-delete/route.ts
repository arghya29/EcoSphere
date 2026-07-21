import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1))
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
  const owned = await prisma.route.findMany({
    where: { id: { in: ids }, organizationId: ctx.organizationId },
    select: { id: true },
  });
  const ownedIds = owned.map((r) => r.id);
  if (ownedIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No matching routes found' }, { status: 404 });
  }

  // Routes have no structural dependents (nothing in the schema requires a
  // route to exist). Historical activities reference routes with a nullable FK;
  // detach them to preserve the emissions record, then delete the routes — all
  // in one atomic transaction. deleteMany is race-safe: concurrent removals
  // yield count 0 rather than throwing P2025.
  const [, deleted] = await prisma.$transaction([
    prisma.activity.updateMany({
      where: { routeId: { in: ownedIds }, organizationId: ctx.organizationId },
      data: { routeId: null },
    }),
    prisma.route.deleteMany({
      where: { id: { in: ownedIds }, organizationId: ctx.organizationId },
    }),
  ]);

  return NextResponse.json({ success: true, data: { deleted: deleted.count } });
}
