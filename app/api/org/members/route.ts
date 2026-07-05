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

  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
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

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user ID' }, { status: 400 });
    }

    // Do not allow deleting own membership
    const session = await prisma.session.findFirst({
      where: { sessionToken: req.headers.get('cookie') ?? '' },
    });
    // For safety, allow delete if membership matches organizationId
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
