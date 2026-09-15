import dotenv from 'dotenv';

dotenv.config();

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
};
