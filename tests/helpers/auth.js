import request from 'supertest';
import { User } from '../../src/db/index.js';

export async function adminToken(app, email = 'admin@test.ru') {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  await User.update({ role: 'admin' }, { where: { email } });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.accessToken;
}

export async function userToken(app, email, role = 'viewer') {
  await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123' });
  if (role !== 'viewer') {
    await User.update({ role }, { where: { email } });
  }
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.data.accessToken;
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
