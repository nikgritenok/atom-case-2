import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { sequelize, Technician, SparePart } from '../src/db/index.js';
import { resetDb } from './helpers/db.js';

const app = buildApp();

beforeEach(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Тесты требуют NODE_ENV=test для защиты основной базы');
  }
  await resetDb(sequelize);
});

afterAll(async () => {
  await sequelize.close();
});

function equipmentPayload(serial = 'SN-EXT-1') {
  return {
    name: 'Турбина Расширенная',
    type: 'turbine',
    serialNumber: serial,
    location: { lat: 55.7, lon: 37.6 },
    status: 'operational',
    installedAt: '2024-01-10T00:00:00.000Z',
  };
}

async function createEquipment(serial) {
  const res = await request(app)
    .post('/api/equipment')
    .send(equipmentPayload(serial))
    .expect(201);
  return res.body.data;
}

async function createRequest(equipmentId, title = 'Проверка узла') {
  const res = await request(app)
    .post('/api/requests')
    .send({ equipmentId, title, priority: 'high' })
    .expect(201);
  return res.body.data;
}

describe('Бригады и статусы', () => {
  it('бригада без ведущего дает 422 и состав остается пустым', async () => {
    const eq = await createEquipment('SN-EXT-BRIG');
    const rq = await createRequest(eq.id);
    const tech = await Technician.create({
      fullName: 'Механик Рядовой',
      tabNumber: 'EXT-001',
    });
    await request(app)
      .post(`/api/requests/${rq.id}/assignees`)
      .send({
        assignees: [{ technicianId: tech.id, role: 'member', hours: 2 }],
      })
      .expect(422);
    const got = await request(app).get(`/api/requests/${rq.id}`).expect(200);
    expect(got.body.data.assignees).toEqual([]);
  });

  it('переход в работу без бригады дает 409', async () => {
    const eq = await createEquipment('SN-EXT-NOCREW');
    const rq = await createRequest(eq.id);
    await request(app)
      .patch(`/api/requests/${rq.id}/status`)
      .send({ status: 'in_progress' })
      .expect(409);
  });

  it('дубль назначения в одном теле дает 409', async () => {
    const eq = await createEquipment('SN-EXT-DUP');
    const rq = await createRequest(eq.id);
    const tech = await Technician.create({
      fullName: 'Механик Двойной',
      tabNumber: 'EXT-002',
    });
    await request(app)
      .post(`/api/requests/${rq.id}/assignees`)
      .send({
        assignees: [
          { technicianId: tech.id, role: 'lead', hours: 2 },
          { technicianId: tech.id, role: 'member', hours: 1 },
        ],
      })
      .expect(409);
  });

  it('прямое изменение истории блокируется триггером', async () => {
    const eq = await createEquipment('SN-EXT-HIST');
    await createRequest(eq.id);
    await expect(
      sequelize.query("UPDATE request_status_history SET comment = 'x'")
    ).rejects.toThrow('История статусов неизменяема');
  });
});

describe('Запчасти и остатки', () => {
  it('списание сверх остатка дает 409 и остаток не меняется', async () => {
    const eq = await createEquipment('SN-EXT-PART');
    const rq = await createRequest(eq.id);
    const spare = await SparePart.create({
      name: 'Фильтр Воздушный',
      sku: 'SKU-EXT-1',
      stock: 2,
    });
    await request(app)
      .post(`/api/requests/${rq.id}/parts`)
      .send({ parts: [{ sparePartId: spare.id, qty: 5 }] })
      .expect(409);
    const after = await SparePart.findByPk(spare.id);
    expect(after.stock).toBe(2);
  });
});
