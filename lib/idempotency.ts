import { prisma } from './prisma';

export async function getIdempotencyRecord(key: string) {
  try {
    const record = await prisma.idempotencyRecord.findUnique({
      where: { key },
    });

    if (!record) return null;

    // Check if expired
    if (new Date() > record.expiresAt) {
      // Clean up expired record asynchronously
      prisma.idempotencyRecord.delete({ where: { key } }).catch((err) => {
        console.error('Failed to delete expired idempotency key:', err);
      });
      return null;
    }

    return record;
  } catch (error) {
    console.error('Failed to get idempotency record:', error);
    return null;
  }
}

export async function saveIdempotencyRecord(
  key: string,
  statusCode: number,
  responseBody: any,
  ttlHours = 24
) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    return await prisma.idempotencyRecord.upsert({
      where: { key },
      create: {
        key,
        statusCode,
        responseBody: JSON.parse(JSON.stringify(responseBody)),
        expiresAt,
      },
      update: {
        statusCode,
        responseBody: JSON.parse(JSON.stringify(responseBody)),
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Failed to save idempotency record:', error);
  }
}
