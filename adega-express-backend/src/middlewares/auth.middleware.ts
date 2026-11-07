import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../services/prisma.service';
import { AppError } from '../lib/errors';

export const SESSION_COOKIE_NAME = 'adega_token';

function extractCookieToken(cookieHeader?: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === SESSION_COOKIE_NAME && rest.length) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  void authenticate(req)
    .then(() => next())
    .catch(next);
}
async function authenticate(req: Request): Promise<void> {
  const bearerToken = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  const cookieToken = extractCookieToken(req.headers.cookie);
  const token = bearerToken ?? cookieToken;
  if (!token) {
    throw new AppError(401, 'Token não fornecido.');
  }
  if (!bearerToken && cookieToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const allowedOrigins = config.CORS_ORIGINS.split(',').map((o) => o.trim());
    if (origin && !allowedOrigins.includes(origin)) {
      throw new AppError(403, 'Origem não permitida para operação mutável.');
    }
  }
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (
      typeof decoded === 'string' ||
      !Number.isSafeInteger(decoded.sub) ||
      typeof decoded.ver !== 'number'
    ) {
      throw new Error('Invalid claims');
    }
    payload = decoded;
  } catch {
    throw new AppError(401, 'Token inválido ou expirado.');
  }
  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, role: true, active: true, token_version: true },
  });
  if (!user || !user.active || user.token_version !== payload.ver) {
    throw new AppError(401, 'Sessão encerrada. Entre novamente.');
  }
  req.user = { sub: user.id, role: user.role };
}
