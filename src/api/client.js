import { config } from '../config.js';
import {
  HttpError,
  TimeoutError,
  NetworkError,
  JsonParseError,
  CityNotFoundError,
} from './errors.js';

/**
 * fetch с таймаутом через AbortController.
 * URL собирается через URL/URLSearchParams (см. ниже).
 */
export async function fetchJson(url, { timeoutMs = config.requestTimeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new TimeoutError(timeoutMs);
    }
    throw new NetworkError(err.message ?? err);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new HttpError(response.status, url.toString());
  }

  try {
    return await response.json();
  } catch {
    throw new JsonParseError();
  }
}

function buildGeocodeUrl(city) {
  const url = new URL(config.geocodingBaseUrl);
  url.search = new URLSearchParams({
    name: city,
    count: '1',
    language: 'ru',
    format: 'json',
  }).toString();
  return url;
}

function buildForecastUrl(latitude, longitude, days) {
  const url = new URL(config.forecastBaseUrl);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    forecast_days: String(days),
    timezone: 'auto',
  }).toString();
  return url;
}

/** Извлекает первую запись геокодинга, бросает CityNotFoundError если пусто. */
export function pickGeoResult(data, city) {
  const results = data?.results;
  if (!Array.isArray(results) || results.length === 0) {
    throw new CityNotFoundError(city);
  }
  const r = results[0];
  return {
    name: r.name,
    country: r.country ?? '—',
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

/** Превращает daily-массивы Open-Meteo в массив по дням. Вынесено для тестов. */
export function mapDailyToDays(daily, days) {
  if (!daily?.time || !daily?.temperature_2m_max) {
    throw new JsonParseError();
  }
  const out = [];
  for (let i = 0; i < days; i += 1) {
    out.push({
      date: daily.time[i],
      tempMin: daily.temperature_2m_min?.[i] ?? null,
      tempMax: daily.temperature_2m_max?.[i] ?? null,
      precipitation: daily.precipitation_sum?.[i] ?? null,
    });
  }
  return out;
}

export async function geocodeCity(city) {
  const url = buildGeocodeUrl(city);
  const data = await fetchJson(url);
  return pickGeoResult(data, city);
}

export async function getForecast(latitude, longitude, days) {
  const url = buildForecastUrl(latitude, longitude, days);
  const data = await fetchJson(url);
  return mapDailyToDays(data?.daily, days);
}
