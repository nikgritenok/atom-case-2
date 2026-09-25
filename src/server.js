import { buildApp } from './app.js';
import { config } from './config/index.js';
import sequelize from './db/sequelize.js';
import { logger } from './middlewares/logger.js';

const app = buildApp();

async function closeDatabase() {
  await sequelize.close();
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    await closeDatabase();
    process.exit(0);
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

app.listen(config.port, () => {
  logger.info(`Сервер запущен на порту ${config.port}`);
});
