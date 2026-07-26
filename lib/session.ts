import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Resolves the signed-in user's session and their switched active organization
 * or their first organization fallback.
 *
 * Returns a NextResponse to short-circuit with (401/404) when the
 * caller isn't authenticated or has no organization yet, so route
 * handlers can do: `const ctx = await requireOrg(); if (ctx instanceof
 * NextResponse) return ctx;`
 */
export async function requireOrg() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const activeOrgId = session?.activeOrgId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let membership = null;
  if (activeOrgId) {
    membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: activeOrgId,
        },
      },
      include: { organization: true },
    });
  }

  // Fallback to first membership in database order if activeOrgId is not set or not a valid membership
  if (!membership) {
    membership = await prisma.membership.findFirst({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!membership) {
    return NextResponse.json(
      { success: false, error: 'No organization found for user', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return {
    userId,
    organizationId: membership.organizationId,
    organization: membership.organization,
  };
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
