try {
  process.loadEnvFile();
} catch {}

function num(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: num(process.env.PORT, 3000),
  env: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  rateWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateMax: num(process.env.RATE_LIMIT_MAX, 100),
  weatherApiUrl:
    process.env.WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: num(process.env.REQUEST_TIMEOUT_MS, 5000),
  windThreshold: Number(process.env.WIND_THRESHOLD_MS ?? '10'),
  precipThreshold: Number(process.env.PRECIP_THRESHOLD_MM ?? '0.5'),
  bodyLimit: process.env.BODY_LIMIT ?? '100kb',
  dbPath: process.env.DB_PATH ?? 'data/db.json',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: num(process.env.DB_PORT, 5432),
    name: process.env.DB_NAME ?? 'maintenance',
    user: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    poolMax: num(process.env.DB_POOL_MAX, 10),
    poolMin: num(process.env.DB_POOL_MIN, 2),
    acquire: num(process.env.DB_POOL_ACQUIRE_MS, 30000),
    idle: num(process.env.DB_POOL_IDLE_MS, 10000),
  },
  dbTestName:
    process.env.DB_NAME_TEST ?? `${process.env.DB_NAME ?? 'maintenance'}_test`,
  maxLimit: 100,
  maxOffset: 10000,
};
