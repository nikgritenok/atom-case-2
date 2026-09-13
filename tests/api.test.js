import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapDailyToDays, pickGeoResult } from '../src/api/client.js';
import { CityNotFoundError, JsonParseError } from '../src/api/errors.js';

describe('mapDailyToDays — разбор ответа API', () => {
  it('маппит массивы daily в дни', () => {
    const daily = {
      time: ['2026-09-13', '2026-09-14'],
      temperature_2m_max: [16.2, 18.4],
      temperature_2m_min: [7.7, 9.2],
      precipitation_sum: [0, 1.5],
    };
    assert.deepEqual(mapDailyToDays(daily, 2), [
      { date: '2026-09-13', tempMin: 7.7, tempMax: 16.2, precipitation: 0 },
      { date: '2026-09-14', tempMin: 9.2, tempMax: 18.4, precipitation: 1.5 },
    ]);
  });

  it('бросает JsonParseError на битом daily', () => {
    assert.throws(() => mapDailyToDays({}, 2), JsonParseError);
    assert.throws(() => mapDailyToDays(null, 2), JsonParseError);
  });
});

describe('pickGeoResult — город не найден', () => {
  it('возвращает первый результат', () => {
    const data = {
      results: [{ name: 'Казань', country: 'Россия', latitude: 55.79, longitude: 49.12 }],
    };
    assert.deepEqual(pickGeoResult(data, 'Казань'), {
      name: 'Казань',
      country: 'Россия',
      latitude: 55.79,
      longitude: 49.12,
    });
  });

  it('бросает CityNotFoundError на пустом results', () => {
    assert.throws(() => pickGeoResult({}, 'XYZ'), CityNotFoundError);
    assert.throws(() => pickGeoResult({ results: [] }, 'XYZ'), CityNotFoundError);
  });
});
