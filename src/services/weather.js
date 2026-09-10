import { geocodeCity, getForecast } from '../api/client.js';

/**
 * Бизнес-логика: для каждого города геокодинг -> прогноз.
 * Города идут параллельно через Promise.allSettled,
 * сбой одного не прерывает остальные.
 */
export async function getWeatherForCities({ cities, days }) {
  const settled = await Promise.allSettled(
    cities.map((city) => getWeatherForCity(city, days))
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

async function getWeatherForCity(city, days) {
  const geo = await geocodeCity(city);
  const forecast = await getForecast(geo.latitude, geo.longitude, days);
  return {
    requestedCity: city,
    city: geo.name,
    country: geo.country,
    latitude: geo.latitude,
    longitude: geo.longitude,
    days,
    forecast,
    fetchedAt: new Date().toISOString(),
  };
}
