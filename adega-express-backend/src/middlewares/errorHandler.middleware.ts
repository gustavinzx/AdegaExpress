import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500;
  let message = 'Erro interno do servidor.';
  let details: unknown;
  if (error instanceof ZodError) {
    status = 400;
    message = 'Dados inválidos.';
    details = error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  } else if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const codes: Record<string, [number, string]> = {
      P2002: [409, 'Registro já existente.'],
      P2003: [409, 'Registro vinculado ou referência inválida.'],
      P2025: [404, 'Registro não encontrado.'],
      P2034: [409, 'Operação concorrente. Tente novamente.'],
      P2024: [503, 'Banco de dados temporariamente indisponível.'],
    };
    [status, message] = codes[error.code] ?? [500, message];
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    message = 'Banco de dados indisponível.';
  } else if (error instanceof Error && 'type' in error && error.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON inválido.';
  } else if (error instanceof Error && 'type' in error && error.type === 'entity.too.large') {
    status = 413;
    message = 'Corpo da requisição excede o limite.';
  }
  if (status >= 500) {
    console.error(
      JSON.stringify({
        event: 'request_failed',
        requestId: res.locals.requestId as string,
        error: error instanceof Error ? error.name : 'UnknownError',
        status,
      }),
    );
  }
  res.status(status).json({
    status: 'error',
    statusCode: status,
    message,
    ...(details ? { details } : {}),
    request_id: res.locals.requestId as string,
  });
}
