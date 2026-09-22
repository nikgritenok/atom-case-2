import { buildApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './middlewares/logger.js';

const app = buildApp();

app.listen(config.port, () => {
  logger.info(`Сервер запущен на порту ${config.port}`);
});
