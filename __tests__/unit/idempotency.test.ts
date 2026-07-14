import { getIdempotencyRecord, saveIdempotencyRecord } from '@/lib/idempotency';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    idempotencyRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('Idempotency Key library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null if no record is found', async () => {
    (prisma.idempotencyRecord.findUnique as jest.Mock).mockResolvedValue(null);

    const record = await getIdempotencyRecord('test-key');
    expect(record).toBeNull();
  });

  it('returns the record if it exists and is not expired', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const mockRecord = {
      id: 'rec-1',
      key: 'test-key',
      statusCode: 201,
      responseBody: { success: true },
      expiresAt: futureDate,
    };

    (prisma.idempotencyRecord.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    const record = await getIdempotencyRecord('test-key');
    expect(record).toEqual(mockRecord);
  });

  it('returns null and deletes if the record is expired', async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const mockRecord = {
      id: 'rec-1',
      key: 'test-key',
      statusCode: 201,
      responseBody: { success: true },
      expiresAt: pastDate,
    };

    (prisma.idempotencyRecord.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    const record = await getIdempotencyRecord('test-key');
    expect(record).toBeNull();
    expect(prisma.idempotencyRecord.delete).toHaveBeenCalledWith({
      where: { key: 'test-key' },
    });
  });

  it('saves/upserts idempotency record correctly', async () => {
    await saveIdempotencyRecord('test-key', 201, { success: true });

    expect(prisma.idempotencyRecord.upsert).toHaveBeenCalledWith({
      where: { key: 'test-key' },
      create: {
        key: 'test-key',
        statusCode: 201,
        responseBody: { success: true },
        expiresAt: expect.any(Date),
      },
      update: {
        statusCode: 201,
        responseBody: { success: true },
        expiresAt: expect.any(Date),
      },
    });
  });
});
