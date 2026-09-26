try {
  process.loadEnvFile();
} catch {}

const { Client } = await import('pg');

const testDb =
  process.env.DB_NAME_TEST ?? `${process.env.DB_NAME ?? 'maintenance'}_test`;

const client = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
  user: process.env.DB_USER ?? 'app',
  password: process.env.DB_PASSWORD ?? 'app',
  database: process.env.DB_NAME ?? 'maintenance',
});

await client.connect();
try {
  await client.query(`CREATE DATABASE "${testDb.replaceAll('"', '')}"`);
  console.log(`База ${testDb} создана`);
} catch (err) {
  if (err?.code !== '42P04') throw err;
  console.log(`База ${testDb} уже есть пропуск`);
} finally {
  await client.end();
}
