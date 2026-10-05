import express from 'express';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/logger.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { metricsMiddleware, metricsHandler } from './middlewares/metrics.js';
import sequelize from './db/sequelize.js';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import { authenticate, requireRoles } from './middlewares/auth.js';
import equipmentRoutes from './routes/equipment.js';
import requestRoutes from './routes/requests.js';
import sitesRoutes from './routes/sites.js';
import reportsRoutes from './routes/reports.js';
import cors from 'cors';
import helmet from 'helmet';

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(httpLogger);
  app.use(metricsMiddleware);
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(cookieParser());
  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
  );

  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: config.loginWindowMs,
      max: config.loginMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Слишком много попыток входа, попробуйте позже',
            details: [],
            requestId: req.requestId ?? 'unknown',
          },
        });
      },
    })
  );
  app.use('/api/auth', authRoutes);
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(YAML.load('openapi/openapi.yaml'))
  );
  app.get('/metrics', metricsHandler);

  app.get('/api/health/live', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });
  app.get('/api/health/ready', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({ data: { status: 'ready' } });
    } catch {
      res.status(503).json({
        error: {
          code: 'NOT_READY',
          message: 'База данных недоступна',
          details: [],
          requestId: req.requestId ?? 'unknown',
        },
      });
    }
  });

  app.use('/api', apiLimiter);
  app.use('/api', authenticate);
  app.use('/api/equipment', requireRoles('admin'));
  app.use('/api/sites', requireRoles('admin'));
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
