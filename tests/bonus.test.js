import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import {
  sequelize,
  Site,
  Equipment,
  MaintenanceRequest,
} from '../src/db/index.js';
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

function equipmentPayload(serial = 'SN-BONUS-1') {
  return {
    name: 'Турбина Бонусная',
    type: 'turbine',
    serialNumber: serial,
    location: { lat: 55.7, lon: 37.6 },
    status: 'operational',
    installedAt: '2024-01-10T00:00:00.000Z',
  };
}

async function createSite(code = 'SITE-1') {
  return Site.create({ name: 'Площадка Северная', code });
}

function equipmentRow(siteId, serial, name = 'Турбина Нагрузочная') {
  return {
    siteId,
    name,
    type: 'turbine',
    serialNumber: serial,
    lat: 55.7,
    lon: 37.6,
    status: 'operational',
    installedAt: new Date('2024-01-10T00:00:00.000Z'),
  };
}

async function createRequestRow(equipmentId, title, status = 'new') {
  return MaintenanceRequest.create({
    equipmentId,
    title,
    priority: 'high',
    status,
  });
}

describe('Мягкое удаление оборудования', () => {
  it('удаленная карточка прячется а серийник доступен снова', async () => {
    const created = await request(app)
      .post('/api/equipment')
      .send(equipmentPayload('SN-BONUS-DEL'))
      .expect(201);
    const id = created.body.data.id;
    await request(app).delete(`/api/equipment/${id}`).expect(204);
    await request(app).get(`/api/equipment/${id}`).expect(404);
    await request(app)
      .post('/api/equipment')
      .send(equipmentPayload('SN-BONUS-DEL'))
      .expect(201);
  });
});

describe('Поиск оборудования', () => {
  it('находит по подстроке и отсекает чужое', async () => {
    await request(app)
      .post('/api/equipment')
      .send({ ...equipmentPayload('SN-BONUS-S1'), name: 'Турбина Поисковая' })
      .expect(201);
    await request(app)
      .post('/api/equipment')
      .send({ ...equipmentPayload('SN-BONUS-S2'), name: 'Датчик Обычный' })
      .expect(201);
    const res = await request(app)
      .get(`/api/equipment?search=${encodeURIComponent('Поисковая')}`)
      .expect(200);
    const names = res.body.data.map((item) => item.name);
    expect(names).toContain('Турбина Поисковая');
    expect(names).not.toContain('Датчик Обычный');
  });
});

describe('Отчет по загрузке', () => {
  it('порог отсекает слабо загруженное оборудование', async () => {
    const busy = await Equipment.create(
      equipmentRow(null, 'SN-BONUS-L1', 'Турбина Загруженная')
    );
    const idle = await Equipment.create(
      equipmentRow(null, 'SN-BONUS-L2', 'Турбина Спящая')
    );
    await createRequestRow(busy.id, 'Проверка первого узла');
    await createRequestRow(busy.id, 'Проверка второго узла');
    await createRequestRow(idle.id, 'Проверка третьего узла');
    const res = await request(app)
      .get('/api/reports/equipment-load?minRequests=2')
      .expect(200);
    const ids = res.body.data.map((item) => item.equipmentId);
    expect(ids).toContain(busy.id);
    expect(ids).not.toContain(idle.id);
  });
});

describe('Сводка площадки', () => {
  it('сумма по статусам сходится с итогом', async () => {
    const site = await createSite('SITE-SUM');
    const eq = await Equipment.create(
      equipmentRow(site.id, 'SN-BONUS-SUM', 'Турбина Сводная')
    );
    await createRequestRow(eq.id, 'Заявка первая новая', 'new');
    await createRequestRow(eq.id, 'Заявка вторая в работе', 'in_progress');
    await createRequestRow(eq.id, 'Заявка третья готова', 'done');
    const res = await request(app)
      .get(`/api/sites/${site.id}/summary`)
      .expect(200);
    const byStatus = res.body.data.byStatus;
    const sum =
      byStatus.new + byStatus.in_progress + byStatus.done + byStatus.rejected;
    expect(res.body.data.total).toBe(sum);
    expect(res.body.data.total).toBe(3);
  });
});
