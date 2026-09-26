try {
  process.loadEnvFile();
} catch {}

const { existsSync, readFileSync } = await import('node:fs');
const path = await import('node:path');

const dbPath =
  process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'db.json');

if (!existsSync(dbPath)) {
  console.warn(`Файл ${dbPath} не найден пропуск импорта`);
  process.exit(0);
}

const raw = JSON.parse(readFileSync(dbPath, 'utf8'));
const fileEquipment = raw.equipment ?? raw.equipments ?? [];
const fileRequests = raw.requests ?? raw.maintenanceRequests ?? [];

const { sequelize, Equipment, MaintenanceRequest } =
  await import('../src/db/index.js');

let equipmentInserted = 0;
let equipmentSkipped = 0;
for (const item of fileEquipment) {
  const serialNumber = item.serialNumber ?? item.serial_number;
  const bySerial = await Equipment.findOne({
    where: { serialNumber },
    paranoid: false,
  });
  if (bySerial) {
    console.warn(`Серийник ${serialNumber} уже существует пропуск`);
    equipmentSkipped += 1;
    continue;
  }
  const byId = item.id
    ? await Equipment.findByPk(item.id, { paranoid: false })
    : null;
  if (byId) {
    console.warn(`Оборудование ${item.id} уже существует пропуск`);
    equipmentSkipped += 1;
    continue;
  }
  await Equipment.create({
    id: item.id,
    siteId: item.siteId ?? item.site_id ?? null,
    name: item.name,
    type: item.type,
    serialNumber,
    lat: item.lat ?? item.location?.lat,
    lon: item.lon ?? item.location?.lon,
    status: item.status,
    installedAt: item.installedAt ?? item.installed_at,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  });
  equipmentInserted += 1;
}

let requestsInserted = 0;
let requestsSkipped = 0;
for (const item of fileRequests) {
  const id = item.id;
  if (id) {
    const exists = await MaintenanceRequest.findByPk(id, { paranoid: false });
    if (exists) {
      console.warn(`Заявка ${id} уже существует пропуск`);
      requestsSkipped += 1;
      continue;
    }
  }
  const equipmentId = item.equipmentId ?? item.equipment_id;
  const equipment = equipmentId
    ? await Equipment.findByPk(equipmentId, { paranoid: false })
    : null;
  if (!equipment) {
    console.warn(
      `Оборудование ${equipmentId} для заявки ${id} не найдено пропуск`
    );
    requestsSkipped += 1;
    continue;
  }
  await MaintenanceRequest.create({
    id,
    equipmentId,
    title: item.title,
    description: item.description ?? null,
    priority: item.priority,
    status: item.status ?? 'new',
    plannedAt: item.plannedAt ?? item.planned_at ?? null,
    author: item.author ?? null,
    createdAt: item.createdAt ?? item.created_at,
    updatedAt: item.updatedAt ?? item.updated_at,
  });
  requestsInserted += 1;
}

console.log(
  `Импорт завершен оборудование добавлено ${equipmentInserted} пропущено ${equipmentSkipped} заявки добавлены ${requestsInserted} пропущены ${requestsSkipped}`
);

await sequelize.close();
