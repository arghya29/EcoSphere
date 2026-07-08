import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { z } from 'zod';

import { validateReportOptions } from '@/lib/report-generator';

const reportSchema = z.object({
  format: z.enum(['PDF', 'CSV', 'JSON']),
  options: z.object({
    title: z.string().optional(),
    themeColor: z.string().optional(),
    includeSummary: z.boolean().optional(),
    includeDetails: z.boolean().optional(),
  }).optional(),
});

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const reports = await prisma.report.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ success: true, data: reports });
}

// Report files are generated client-side (jsPDF / PapaParse / JSON blob)
// per the zero-server-cost constraint in the proposal. This endpoint
// just records that a report was generated, for the history list.
export async function POST(req: NextRequest) {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid format' }, { status: 400 });
    }

    if (parsed.data.options && !validateReportOptions(parsed.data.options)) {
      return NextResponse.json({ success: false, error: 'Invalid custom options' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: { organizationId: ctx.organizationId, format: parsed.data.format },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to record report' }, { status: 500 });
  }
}
