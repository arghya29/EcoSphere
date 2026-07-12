import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { facilitiesPayloadSchema } from '@/lib/validations';
import { apiError, handleApiError } from '@/lib/api-error';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const facilities = await prisma.facility.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: facilities });
  } catch (err) {
    return handleApiError(err, 'GET /api/facilities');
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const parsed = facilitiesPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400,
        'VALIDATION_ERROR',
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message])
        )
      );
    }

    const created = await prisma.$transaction(
      parsed.data.facilities.map((f) =>
        prisma.facility.create({
          data: { ...f, organizationId: ctx.organizationId },
        })
      )
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'POST /api/facilities');
  }
}
