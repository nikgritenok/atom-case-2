/**
 * Разбор аргументов командной строки.
 * Поддерживает: --city (обязателен, список через запятую),
 * --days (опционален, 1–7, по умолчанию 3),
 * --no-cache (принудительный запрос заново),
 * --help.
 */

export class CliError extends Error {}

export function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    cities: [],
    days: 3,
    noCache: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      return result;
    }

    if (arg === '--no-cache') {
      result.noCache = true;
      continue;
    }

    if (arg === '--city') {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new CliError('Параметр --city требует значение. Пример: --city "Москва"');
      }
      result.cities = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg.startsWith('--city=')) {
      const value = arg.slice('--city='.length);
      result.cities = value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }

    if (arg === '--days') {
      const value = args[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new CliError('Параметр --days требует значение от 1 до 7.');
      }
      result.days = Number.parseInt(value, 10);
      i += 1;
      continue;
    }

    if (arg.startsWith('--days=')) {
      result.days = Number.parseInt(arg.slice('--days='.length), 10);
      continue;
    }

    throw new CliError(`Неизвестный аргумент: ${arg}. Используйте --help.`);
  }

  if (result.help) return result;

  if (result.cities.length === 0) {
    throw new CliError(
      'Параметр --city обязателен. Пример: node src/index.js --city "Нижний Новгород" --days 3'
    );
  }

  if (!Number.isInteger(result.days) || result.days < 1 || result.days > 7) {
    throw new CliError(
      `Некорректное значение --days: ожидалось целое число от 1 до 7, получено "${args.join(' ')}".`
    );
  }

  return result;
}

export function printHelp() {
  console.log(`Погодный дайджест — прогноз погоды из Open-Meteo

Использование:
  node src/index.js --city "Город" [--days 1-7] [--no-cache]
  node src/index.js --city "Москва, Казань" --days 3

Параметры:
  --city <название>   Обязателен. Один город или список через запятую.
  --days <1-7>        Необязателен. По умолчанию 3.
  --no-cache          Игнорировать кэш, запросить заново.
  --help, -h          Показать эту справку.

Переменные окружения (.env):
  GEOCODING_BASE_URL, FORECAST_BASE_URL, REQUEST_TIMEOUT_MS, REPORTS_DIR

Коды выхода: 0 — успех, 1 — ошибка.`);
}
