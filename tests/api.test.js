import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { resetCache } from '../src/repositories/store.js';
import { unlink } from 'node:fs/promises';

const app = buildApp();

beforeEach(async () => {
  resetCache();
  try {
    await unlink('data/db.json');
  } catch {
    // файла может не быть
  }
});

function equipmentPayload(serial = 'SN-J1') {
  return {
    name: 'Турбина Тестовая',
    type: 'turbine',
    serialNumber: serial,
    location: { lat: 55.7, lon: 37.6 },
    status: 'operational',
    installedAt: '2024-01-10T00:00:00.000Z',
  };
}

describe('Оборудование', () => {
  it('создает и отдает карточку', async () => {
    const created = await request(app)
      .post('/api/equipment')
      .send(equipmentPayload())
      .expect(201);
    const id = created.body.data.id;
    await request(app).get(`/api/equipment/${id}`).expect(200);
  });

  it('отклоняет дубль серийника кодом 409', async () => {
    await request(app).post('/api/equipment').send(equipmentPayload()).expect(201);
    await request(app).post('/api/equipment').send(equipmentPayload()).expect(409);
  });

  it('отдает список с метой', async () => {
    await request(app).post('/api/equipment').send(equipmentPayload()).expect(201);
    const res = await request(app).get('/api/equipment?page=1&limit=10').expect(200);
    expect(res.body.meta.total).toBe(1);
  });
});

describe('Заявки', () => {
  it('полный цикл статусов и запрет левого перехода', async () => {
    const eq = await request(app)
      .post('/api/equipment')
      .send(equipmentPayload())
      .expect(201);
    const equipmentId = eq.body.data.id;
    const rq = await request(app)
      .post('/api/requests')
      .send({ equipmentId, title: 'Проверка узла', priority: 'high' })
      .expect(201);
    const id = rq.body.data.id;
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: 'in_progress' })
      .expect(200);
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .send({ status: 'new' })
      .expect(409);
  });

  it('заявка на чужое оборудование дает 404', async () => {
    await request(app)
      .post('/api/requests')
      .send({
        equipmentId: '00000000-0000-4000-8000-000000000000',
        title: 'Проверка чужого узла',
        priority: 'low',
      })
      .expect(404);
  });
});
