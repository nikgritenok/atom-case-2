try {
  process.loadEnvFile();
} catch {}

const { sequelize, Site } = await import('../src/db/index.js');

try {
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const { execFileSync } = await import('node:child_process');
    execFileSync(
      'node_modules/.bin/sequelize-cli',
      ['db:seed', '--seed', 'src/db/seeders/09-admin.cjs'],
      { stdio: 'inherit' }
    );
  }
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
