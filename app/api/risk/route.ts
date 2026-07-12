import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrg, isErrorResponse } from '@/lib/session';
import { calculateRiskScore } from '@/lib/risk-engine';

export async function GET() {
  const ctx = await requireOrg();
  if (isErrorResponse(ctx)) return ctx;

  const activities = await prisma.activity.findMany({
    where: { organizationId: ctx.organizationId },
    include: { factor: true },
  });

  const total = activities.reduce((sum, a) => sum + a.emissionsKg, 0);

  const airEmissions = activities
    .filter((a) => a.type === 'FREIGHT' && a.factor.category.includes('air'))
    .reduce((sum, a) => sum + a.emissionsKg, 0);

  const electricityEmissions = activities
    .filter((a) => a.type === 'ELECTRICITY')
    .reduce((sum, a) => sum + a.emissionsKg, 0);

  const riskResult = calculateRiskScore(total, airEmissions, electricityEmissions);

  return NextResponse.json({ success: true, data: riskResult });
}
