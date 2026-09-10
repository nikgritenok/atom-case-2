import { geocodeCity, getForecast } from '../api/client.js';
import { loadCachedReport, saveReport } from '../storage/cache.js';

/**
 * Бизнес-логика: для каждого города геокодинг -> прогноз.
 * Города идут параллельно через Promise.allSettled,
 * сбой одного не прерывает остальные.
 * Кэш: отчёт за текущую дату берётся из файла, --no-cache игнорирует.
 */
export async function getWeatherForCities({ cities, days, noCache }) {
  const settled = await Promise.allSettled(
    cities.map((city) => getWeatherForCity(city, days, { noCache }))
  );

  const results = [];
  const failures = [];

  settled.forEach((entry, idx) => {
    if (entry.status === 'fulfilled') {
      results.push(entry.value);
    } else {
      failures.push({ city: cities[idx], error: entry.reason });
    }
  });

  return { results, failures };
}

async function getWeatherForCity(city, days, { noCache } = {}) {
  if (!noCache) {
    const cached = await loadCachedReport(city);
    if (cached && cached.days === days) {
      return cached;
    }
  }

  const geo = await geocodeCity(city);
  const forecast = await getForecast(geo.latitude, geo.longitude, days);
  const report = {
    requestedCity: city,
    city: geo.name,
    country: geo.country,
    latitude: geo.latitude,
    longitude: geo.longitude,
    days,
    forecast,
    fetchedAt: new Date().toISOString(),
    source: 'network',
  };
  await saveReport(report);
  return report;
}
