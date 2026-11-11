import { Prisma } from '@prisma/client';
import prisma from '../services/prisma.service';
import { config } from '../config';

// Serializable isolation + retries make read/validate/write workflows safe under concurrency.
// In cloud/production environments (Render/TiDB/PlanetScale), use standard managed isolation.
export async function transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const isCloud = config.NODE_ENV === 'production' || !!process.env.RENDER;
  for (let attempt = 0; ; attempt++) {
    try {
      if (isCloud) {
        return await prisma.$transaction(fn, {
          maxWait: 10000,
          timeout: 20000,
        });
      }
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      });
    } catch (error) {
      const errCode =
        error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
          ? error.code
          : '';
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        !isCloud &&
        (/isolation level|serializable|not supported|unsupported|8018|StringExpected|Undefined/i.test(
          `${errMsg} ${errCode}`,
        ) ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2010' || error.code === 'P2028')) ||
          errCode === 'StringExpected')
      ) {
        return await prisma.$transaction(fn, {
          maxWait: 10000,
          timeout: 20000,
        });
      }
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2034' ||
        attempt >= 3
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}
