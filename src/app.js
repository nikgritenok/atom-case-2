import express from 'express';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/logger.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import equipmentRoutes from './routes/equipment.js';
import requestRoutes from './routes/requests.js';
import sitesRoutes from './routes/sites.js';
import reportsRoutes from './routes/reports.js';
import cors from 'cors';
import helmet from 'helmet';

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(httpLogger);
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(requestId);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api', apiLimiter);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
