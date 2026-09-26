import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/index.js';

function uniqueMessage(err) {
  const constraint = String(err?.parent?.constraint ?? err?.constraint ?? '');
  const fields = err?.fields ?? err?.parent?.fields ?? {};
  const hay = `${constraint} ${Object.keys(fields).join(' ')}`.toLowerCase();
  if (hay.includes('serial_number') || hay.includes('serialnumber')) {
    return 'Серийный номер уже занят';
  }
  if (hay.includes('tab_number') || hay.includes('tabnumber')) {
    return 'Табельный номер уже занят';
  }
  if (hay.includes('code')) {
    return 'Код площадки уже занят';
  }
  if (hay.includes('sku')) {
    return 'Артикул запчасти уже занят';
  }
  if (
    hay.includes('request_assignees') ||
    (hay.includes('request_id') && hay.includes('technician_id'))
  ) {
    return 'Специалист уже назначен на заявку';
  }
  if (
    hay.includes('request_spare_parts') ||
    (hay.includes('request_id') && hay.includes('spare_part_id'))
  ) {
    return 'Запчасть уже добавлена к заявке';
  }
  return 'Нарушение уникальности';
}

function foreignKeyMessage(err) {
  const constraint = String(err?.parent?.constraint ?? err?.constraint ?? '');
  const table = String(err?.table ?? err?.parent?.table ?? '');
  const hay = `${constraint} ${table}`.toLowerCase();
  if (hay.includes('equipment')) {
    return 'Оборудование не найдено';
  }
  return 'Связанная запись не найдена';
}

export function mapDbError(err) {
  if (!err || !err.name) {
    return err;
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return new ConflictError(uniqueMessage(err));
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new NotFoundError(foreignKeyMessage(err));
  }
  if (
    err.name === 'SequelizeExclusionConstraintError' ||
    err.name === 'SequelizeCheckConstraintError'
  ) {
    return new ValidationError(err.message);
  }
  if (err.name === 'SequelizeValidationError') {
    const items = Array.isArray(err.errors) ? err.errors : [];
    const isCheck = items.some((e) => {
      const hay = `${e?.type ?? ''} ${e?.validatorKey ?? ''}`.toLowerCase();
      return hay.includes('check');
    });
    if (!isCheck) {
      return err;
    }
    const details = items.map((e) => e?.message).filter(Boolean);
    return new ValidationError(err.message, details);
  }
  return err;
}
