try {
  process.loadEnvFile();
} catch {}

const { sequelize, Site } = await import('../src/db/index.js');

try {
  const count = await Site.count();
  if (count > 0) {
    console.log(`Сиды уже залиты строк ${count} пропуск`);
  } else {
    const { execFileSync } = await import('node:child_process');
    execFileSync('node_modules/.bin/sequelize-cli', ['db:seed:all'], {
      stdio: 'inherit',
    });
  }
} finally {
  await sequelize.close();
}
