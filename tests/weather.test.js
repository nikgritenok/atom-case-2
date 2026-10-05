import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { sequelize } from '../src/db/index.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';
import { isWorkAllowed } from '../src/services/weather.js';

const app = buildApp();
let admin;

const forecastOk = {
  daily: { precipitation_sum: [0, 0], wind_speed_10m_max: [5, 5] },
};

beforeEach(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Тесты требуют NODE_ENV=test для защиты основной базы');
  }
  await resetDb(sequelize);
  admin = await adminToken(app);
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => forecastOk,
  });
});

afterAll(async () => {
  delete globalThis.fetch;
  await sequelize.close();
});

function equipmentPayload(serial = 'SN-WX-1') {
  return {
    name: 'Турбина Погодная',
    type: 'turbine',
    serialNumber: serial,
    location: { lat: 55.7, lon: 37.6 },
    status: 'operational',
    installedAt: '2024-01-10T00:00:00.000Z',
  };
}

describe('Погода', () => {
  it('отдает прогноз без выхода в сеть', async () => {
    const created = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(201);
    const res = await request(app)
      .get(`/api/equipment/${created.body.data.id}/weather`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(res.body.data.suitable).toBe(true);
    expect(res.body.data.forecast.precipitation).toEqual([0, 0]);
  });

  it('непогода запрещает окно', () => {
    expect(
      isWorkAllowed({
        daily: { precipitation_sum: [5, 0], wind_speed_10m_max: [5, 5] },
      })
    ).toBe(false);
  });
});
