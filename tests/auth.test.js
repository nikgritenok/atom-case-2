import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { sequelize, Technician, User } from '../src/db/index.js';
import { resetDb } from './helpers/db.js';
import { userToken } from './helpers/auth.js';

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

function equipmentPayload(serial = 'SN-AUTH-1') {
  return {
    name: 'Турбина Авторизация',
    type: 'turbine',
    serialNumber: serial,
    location: { lat: 55.7, lon: 37.6 },
    status: 'operational',
    installedAt: '2024-01-10T00:00:00.000Z',
  };
}

describe('Аутентификация', () => {
  it('полный цикл register login me refresh logout', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'cycle@test.ru', password: 'password123' })
      .expect(201);
    expect(reg.body.data.role).toBe('viewer');
    expect(reg.body.data.passwordHash).toBeUndefined();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cycle@test.ru', password: 'password123' })
      .expect(200);
    expect(login.body.data.accessToken).toBeDefined();
    const cookies = login.headers['set-cookie'] ?? [];
    expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(200);
    expect(me.body.data.email).toBe('cycle@test.ru');

    const cookie = cookies[0].split(';')[0];
    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(200);
    expect(refreshed.body.data.accessToken).toBeDefined();

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', refreshed.headers['set-cookie'][0].split(';')[0])
      .expect(204);

    const stale = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie)
      .expect(401);
    expect(stale.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('дубль email дает 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.ru', password: 'password123' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.ru', password: 'password123' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('неверный логин не раскрывает причину', async () => {
    const missing = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.ru', password: 'password123' })
      .expect(401);
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'real@test.ru', password: 'password123' })
      .expect(201);
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'real@test.ru', password: 'otherpass1' })
      .expect(401);
    expect(missing.body.error.message).toBe(wrong.body.error.message);
  });
});

describe('Матрица доступа', () => {
  it('без токена 401, viewer на изменении 403', async () => {
    await request(app).get('/api/equipment').expect(401);
    const viewer = await userToken(app, 'viewer@test.ru', 'viewer');
    await request(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${viewer}`)
      .send(equipmentPayload())
      .expect(403);
  });

  it('technician меняет статус только своих заявок', async () => {
    const admin = await userToken(app, 'boss@test.ru', 'admin');
    const auth = (t) => ({ Authorization: `Bearer ${t}` });
    const eq = await request(app)
      .post('/api/equipment')
      .set(auth(admin))
      .send(equipmentPayload())
      .expect(201);

    const techA = await userToken(app, 'a@test.ru', 'technician');
    const techBU = await User.findOne({ where: { email: 'a@test.ru' } });
    const techRow = await Technician.create({
      fullName: 'Техник А',
      tabNumber: 'AUTH-A',
    });
    techBU.technicianId = techRow.id;
    await techBU.save();
    const techAToken = (
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'a@test.ru', password: 'password123' })
    ).body.data.accessToken;

    const rq = await request(app)
      .post('/api/requests')
      .set(auth(techAToken))
      .send({
        equipmentId: eq.body.data.id,
        title: 'Заявка техника А',
        priority: 'high',
      })
      .expect(201);

    const stranger = await userToken(app, 'b@test.ru', 'technician');
    const st = await request(app)
      .patch(`/api/requests/${rq.body.data.id}/status`)
      .set(auth(stranger))
      .send({ status: 'in_progress' })
      .expect(403);
    expect(st.body.error.code).toBe('FORBIDDEN');
    void techA;
  });
});
