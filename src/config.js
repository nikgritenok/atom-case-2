/**
 * Централизованная конфигурация.
 * Все настраиваемые параметры — через переменные окружения.
 */

export const config = {
  geocodingBaseUrl:
    process.env.GEOCODING_BASE_URL ??
    'https://geocoding-api.open-meteo.com/v1/search',
  forecastBaseUrl:
    process.env.FORECAST_BASE_URL ?? 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: Number.parseInt(
    process.env.REQUEST_TIMEOUT_MS ?? '5000',
    10
  ),
  reportsDir: process.env.REPORTS_DIR ?? 'reports',
};
