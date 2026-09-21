import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'crypto';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { apiRouter, openapi } from './routes/api';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { AppError } from './lib/errors';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.TRUST_PROXY_HOPS);
app.set('query parser', 'simple');
app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store');
  const started = Date.now();
  res.on('finish', () => {
    if (config.NODE_ENV !== 'test') {
      console.info(
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration_ms: Date.now() - started,
        }),
      );
    }
  });
  next();
});
app.use(helmet());
const origins = config.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new AppError(403, 'Origem não permitida.'));
      }
    },
    exposedHeaders: ['X-Request-Id', 'Idempotency-Replayed'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '64kb' }));
const limitMessage = {
  status: 'error',
  message: 'Muitas requisições. Tente novamente mais tarde.',
};
app.use(
  rateLimit({
    windowMs: 60000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: limitMessage,
  }),
);
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage,
});
app.use(['/auth/login', '/auth/register'], authLimit);
app.get('/openapi.json', (_req, res) => {
  res.json(openapi);
});
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    swaggerOptions: { persistAuthorization: false },
    customSiteTitle: 'Adega Express API',
  }),
);
app.use(apiRouter);
app.use((_req, _res, next) => next(new AppError(404, 'Rota não encontrada.')));
app.use(errorHandler);
export default app;
