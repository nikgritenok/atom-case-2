try {
  process.loadEnvFile();
} catch {}

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
};

const devDb = process.env.DB_NAME ?? 'maintenance';

module.exports = {
  development: {
    ...base,
    database: devDb,
  },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST ?? `${devDb}_test`,
  },
  production: {
    ...base,
    database: process.env.DB_NAME,
  },
};
