import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const memberships = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ success: true, data: memberships });
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  // Check requester's role (only OWNER can mutate members)
  const requesterMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== 'OWNER') {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires OWNER role' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 }
      );
    }

    // Do not allow assigning OWNER role via invite or update to prevent multiple owners
    if (parsed.data.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot assign or promote to OWNER role' },
        { status: 400 }
      );
    }

    // Check if user already exists, otherwise simulate/create a placeholder user
    let user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.email.split('@')[0],
        },
      });
    }

    // Prevent modifying own role
    if (user.id === ctx.userId) {
      return NextResponse.json({ success: false, error: 'Cannot change your own role' }, { status: 400 });
    }

    // If target user is an existing OWNER, prevent demoting them if they are the last owner
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: ctx.organizationId,
        },
      },
    });

    if (existingMembership && existingMembership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: {
          organizationId: ctx.organizationId,
          role: 'OWNER',
        },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ success: false, error: 'Cannot demote the last owner' }, { status: 400 });
      }
    }

    // Upsert membership
    const membership = await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: ctx.organizationId,
        },
      },
      create: {
        userId: user.id,
        organizationId: ctx.organizationId,
        role: parsed.data.role,
      },
      update: {
        role: parsed.data.role,
      },
    });

    return NextResponse.json({ success: true, data: membership }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  // Check requester's role (only OWNER can mutate members)
  const requesterMembership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      },
    },
  });

  if (!requesterMembership || requesterMembership.role !== 'OWNER') {
    return NextResponse.json({ success: false, error: 'Forbidden: Requires OWNER role' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    let userId = url.searchParams.get('userId');
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {}
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
    }

    if (userId === ctx.userId) {
      return NextResponse.json({ success: false, error: 'Cannot remove yourself from the organization' }, { status: 400 });
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: ctx.organizationId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    if (targetMembership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: {
          organizationId: ctx.organizationId,
          role: 'OWNER',
        },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ success: false, error: 'Cannot remove the last owner of the organization' }, { status: 400 });
      }
    }

    await prisma.membership.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: ctx.organizationId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}

