import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { sequelize, Technician } from '../src/db/index.js';
import { adminToken } from './helpers/auth.js';
const app = buildApp();
let admin;
beforeEach(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Тесты требуют NODE_ENV=test для защиты основной базы');
  }
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  admin = await adminToken(app);
});
afterAll(async () => {
  await sequelize.close();
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
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(201);
    const id = created.body.data.id;
    await request(app)
      .get(`/api/equipment/${id}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
  });

  it('отклоняет дубль серийника кодом 409', async () => {
    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(201);
    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(409);
  });

  it('отдает список с метой', async () => {
    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(201);
    const res = await request(app)
      .get('/api/equipment?page=1&limit=10')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(res.body.meta.total).toBe(1);
  });
});

describe('Заявки', () => {
  it('полный цикл статусов и запрет левого перехода', async () => {
    const eq = await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin}`)
      .send(equipmentPayload())
      .expect(201);
    const equipmentId = eq.body.data.id;
    const rq = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${admin}`)
      .send({ equipmentId, title: 'Проверка узла', priority: 'high' })
      .expect(201);
    const id = rq.body.data.id;
    const tech = await Technician.create({
      fullName: 'Тестовый Механик',
      tabNumber: 'TEST-001',
    });
    await request(app)
      .post(`/api/requests/${id}/assignees`)
      .set('Authorization', `Bearer ${admin}`)
      .send({
        assignees: [{ technicianId: tech.id, role: 'lead', hours: 2 }],
      })
      .expect(200);
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'in_progress' })
      .expect(200);
    await request(app)
      .patch(`/api/requests/${id}/status`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ status: 'new' })
      .expect(409);
  });

  it('заявка на чужое оборудование дает 404', async () => {
    await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        equipmentId: '00000000-0000-4000-8000-000000000000',
        title: 'Проверка чужого узла',
        priority: 'low',
      })
      .expect(404);
  });
});
