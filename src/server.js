import { buildApp } from './app.js';
import { config } from './config/index.js';
import sequelize from './db/sequelize.js';
import { logger } from './middlewares/logger.js';

const app = buildApp();

const server = app.listen(config.port, () => {
  logger.info(`Сервер запущен на порту ${config.port}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  });
}

try {
  await sequelize.authenticate();
} catch {
  logger.error(
    `Не удалось подключиться к PostgreSQL ${config.db.host}:${config.db.port}`
  );
  process.exit(1);
}
if (!config.jwtSecret) {
  logger.error('JWT_SECRET не задан');
  process.exit(1);
}
