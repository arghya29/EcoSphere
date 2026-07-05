import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { orgId } = await request.json();
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json({ success: false, error: 'User is not a member of this organization' }, { status: 403 });
    }

    // Return the updated session structure (which client-side update() will receive and update NextAuth with)
    return NextResponse.json({
      success: true,
      activeOrgId: orgId,
      session: {
        ...session,
        activeOrgId: orgId,
        activeOrgName: membership.organization.name,
        user: {
          ...session?.user,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
  }
}
