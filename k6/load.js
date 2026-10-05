import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  insecureSkipTLSVerify: true,
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

const BASE = __ENV.BASE_URL ?? 'https://localhost';

export function setup() {
  const res = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({
      email: __ENV.ADMIN_EMAIL ?? 'admin@test.ru',
      password: __ENV.ADMIN_PASSWORD ?? 'password123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: res.json('data.accessToken') };
}

export default function (data) {
  const h = { Authorization: `Bearer ${data.token}` };
  const r1 = http.get(`${BASE}/api/equipment?limit=20`, { headers: h });
  check(r1, { 'equipment 200': (r) => r.status === 200 });
  const r2 = http.get(`${BASE}/api/requests?limit=20`, { headers: h });
  check(r2, { 'requests 200': (r) => r.status === 200 });
  const r3 = http.get(`${BASE}/api/reports/equipment-load`, { headers: h });
  check(r3, { 'report 200': (r) => r.status === 200 });
  sleep(1);
}
