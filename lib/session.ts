import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Resolves the signed-in user's session and their (first/primary)
 * organization. V1 is single-org-per-user, so we just take the
 * first membership; the schema already supports multiple for later.
 *
 * Returns a NextResponse to short-circuit with (401/404) when the
 * caller isn't authenticated or has no organization yet, so route
 * handlers can do: `const ctx = await requireOrg(); if (ctx instanceof
 * NextResponse) return ctx;`
 */
export async function requireOrg() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!membership) {
    return NextResponse.json(
      { success: false, error: 'No organization found for user', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return { userId, organizationId: membership.organizationId, organization: membership.organization };
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
