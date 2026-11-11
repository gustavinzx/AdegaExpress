import { Prisma } from '@prisma/client';
import prisma from '../services/prisma.service';

// Serializable isolation + retries make read/validate/write workflows safe under concurrency.
// Callbacks must only perform database work, never email/payment/network side effects.
export async function transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 15000,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (/isolation level|serializable|not supported|unsupported|8018/i.test(error.message) ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2010' || error.code === 'P2028')))
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
