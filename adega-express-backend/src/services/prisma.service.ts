// src/services/prisma.service.ts
import { PrismaClient } from '@prisma/client';

/**
 * Instancia unica do PrismaClient (Singleton).
 * Reutilize este export em todos os services/repositories.
 */
const prisma = new PrismaClient({
  log: [],
});

export default prisma;
