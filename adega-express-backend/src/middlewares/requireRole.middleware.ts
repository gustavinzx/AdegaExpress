// src/middlewares/requireRole.middleware.ts
import { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

/**
 * Factory que retorna um middleware que restringe a rota aos roles informados.
 * Deve ser usado APOS authMiddleware.
 *
 * @example
 *   router.delete('/products/:id', authMiddleware, requireRole('ADMINISTRADOR'), handler)
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Nao autenticado.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso negado: permissao insuficiente.',
      });
      return;
    }

    next();
  };
}
