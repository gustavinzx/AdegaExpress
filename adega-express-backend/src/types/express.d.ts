// src/types/express.d.ts
import { Role } from '@prisma/client';

export interface AuthPayload {
  sub: number;
  role: Role;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
