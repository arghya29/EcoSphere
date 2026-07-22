import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { suppliersPayloadSchema } from '@/lib/validations';
import { apiError, handleApiError } from '@/lib/api-error';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (err) {
    return handleApiError(err, 'GET /api/suppliers');
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const parsed = suppliersPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? 'Invalid payload',
        400,
        'VALIDATION_ERROR',
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), [issue.message]])
        )
      );
    }

    const created = await prisma.$transaction(
      parsed.data.suppliers.map((s) =>
        prisma.supplier.create({
          data: { ...s, organizationId: ctx.organizationId },
        })
      )
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err, 'POST /api/suppliers');
  }
}
