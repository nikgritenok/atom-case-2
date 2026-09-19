import { config } from '../config/index.js';
import { ExternalError } from '../errors/index.js';

export async function fetchForecast(lat, lon) {
  const url = new URL(config.weatherApiUrl);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'precipitation,wind_speed_10m',
    daily: 'precipitation_sum,wind_speed_10m_max',
    forecast_days: '2',
    timezone: 'auto',
  }).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ExternalError('Превышен таймаут погодного сервиса');
    }
    throw new ExternalError('Погодный сервис недоступен');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ExternalError('Погодный сервис вернул ошибку');
  }

  try {
    return await response.json();
  } catch {
    throw new ExternalError('Погодный сервис вернул битый ответ');
  }
}

export function isWorkAllowed(forecast) {
  const precip = forecast?.daily?.precipitation_sum ?? [99];
  const wind = forecast?.daily?.wind_speed_10m_max ?? [99];
  const maxPrecip = Math.max(...precip.slice(0, 2));
  const maxWind = Math.max(...wind.slice(0, 2));
  return maxPrecip <= config.precipThreshold && maxWind <= config.windThreshold;
}
