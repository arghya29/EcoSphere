import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';

export async function GET(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { orgId: ctx.organizationId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({
        where: { orgId: ctx.organizationId },
      }),
    ]);

    // Retrieve actor user details (names/emails) to display in the UI
    const actorIds = Array.from(new Set(logs.map((l) => l.actor)));
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const logsWithActors = logs.map((log) => {
      const user = userMap.get(log.actor);
      return {
        ...log,
        actorName: user?.name ?? user?.email ?? 'Unknown User',
      };
    });

    return NextResponse.json({
      success: true,
      data: logsWithActors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
