import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('Audit Logging library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls prisma.auditLog.create with correct data', async () => {
    const params = {
      actor: 'user-123',
      action: 'CREATE' as const,
      entity: 'Supplier',
      entityId: 'supplier-456',
      orgId: 'org-789',
      metadata: { name: 'Test Supplier' },
    };

    await logAudit(params);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actor: 'user-123',
        action: 'CREATE',
        entity: 'Supplier',
        entityId: 'supplier-456',
        orgId: 'org-789',
        metadata: { name: 'Test Supplier' },
      },
    });
  });

  it('handles optional fields', async () => {
    const params = {
      actor: 'user-123',
      action: 'LOGIN' as const,
      entity: 'User',
      orgId: 'org-789',
    };

    await logAudit(params);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actor: 'user-123',
        action: 'LOGIN',
        entity: 'User',
        entityId: undefined,
        orgId: 'org-789',
        metadata: undefined,
      },
    });
  });
});
