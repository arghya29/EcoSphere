import { NextRequest, NextResponse } from 'next/server';
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

  // A facility can be a route's origin (optional FK) or its destination
  // (required FK). Either way a dependent route must be removed first: for the
  // destination case the database's required foreign key would reject the
  // delete outright; for the origin case it would leave the route without an
  // origin. Count both and block if any exist.
  const dependentRoutes = await prisma.route.count({
    where: {
      organizationId: ctx.organizationId,
      OR: [{ destinationId: id }, { originFacilityId: id }],
    },
  });
  const guard = guardNodeDeletion('facility', dependentRoutes);
  if (guard.blocked) {
    return NextResponse.json({ success: false, error: guard.error }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.activity.updateMany({
      where: { facilityId: id, organizationId: ctx.organizationId },
      data: { facilityId: null },
    }),
    prisma.facility.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true, data: { id } });
}
