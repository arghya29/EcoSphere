import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';

interface LogAuditParams {
  actor: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  orgId: string;
  metadata?: any;
}

export async function logAudit({
  actor,
  action,
  entity,
  entityId,
  orgId,
  metadata,
}: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actor,
        action,
        entity,
        entityId,
        orgId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
