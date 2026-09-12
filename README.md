# Погодный дайджест

Консольная утилита на Node.js для работы с внешним REST API (Open-Meteo).
Принимает город или список городов, получает прогноз погоды, выводит таблицу в терминал и сохраняет отчёт в `reports/{город}-{ГГГГ-ММ-ДД}.json`.

## Требования к окружению

- Node.js >= 20 (встроенный `fetch`)
- npm
- Доступ в интернет к `open-meteo.com`

## Установка

```bash
git clone <repo-url>
cd weather-digest
npm install
cp .env.example .env
```

## Переменные окружения

| Переменная           | По умолчанию                                     | Описание                                |
| -------------------- | ------------------------------------------------ | --------------------------------------- |
| `GEOCODING_BASE_URL` | `https://geocoding-api.open-meteo.com/v1/search` | Геокодинг                               |
| `FORECAST_BASE_URL`  | `https://api.open-meteo.com/v1/forecast`         | Прогноз                                 |
| `REQUEST_TIMEOUT_MS` | `5000`                                           | Таймаут запроса, мс (`AbortController`) |
| `REPORTS_DIR`        | `reports`                                        | Каталог отчётов                         |

`.env` в git не коммитится, пример — в `.env.example`.

## Запуск

```bash
# один город, 3 дня по умолчанию
node src/index.js --city "Нижний Новгород"

# явно дни 1–7
node src/index.js --city "Нижний Новгород" --days 3

# несколько городов через запятую (параллельно)
node src/index.js --city "Москва, Казань" --days 2

# игнорировать кэш
node src/index.js --city "Москва" --days 2 --no-cache

# справка
node src/index.js --help

# через npm
npm start -- --city "Москва" --days 2
```

## Пример вывода

```text
Москва, Россия
Координаты: 55.75204, 37.61781
Прогноз на 2 дн.:
┌─────────┬──────────────┬────────┬─────────┬────────────┐
│ (index) │ Дата         │ Мин °C │ Макс °C │ Осадки, мм │
├─────────┼──────────────┼────────┼─────────┼────────────┤
│ 0       │ '2026-09-13' │ 7.7    │ 16.2    │ 0          │
│ 1       │ '2026-09-14' │ 9.2    │ 18.4    │ 0          │
└─────────┴──────────────┴─────────┴─────────┴────────────┘
Отчёт: reports/Москва-2026-09-13.json
```

Повторный запуск за тот же день берёт данные из файла без сети (`(из кэша)`).

## Ошибки и коды выхода

| Ситуация                        | Сообщение                                     | Exit |
| ------------------------------- | --------------------------------------------- | ---- |
| Нет `--city` / неизвестный флаг | `Ошибка: Параметр --city обязателен...`       | 1    |
| `--days` не 1–7                 | `Ошибка: Некорректное значение --days...`     | 1    |
| Город не найден                 | `Ошибка (Город): Город не найден...`          | 1    |
| HTTP 4xx                        | `Ошибка ...: Ошибка запроса API: HTTP 4xx...` | 1    |
| HTTP 5xx                        | `Ошибка ...: Ошибка сервера API: HTTP 5xx...` | 1    |
| Нет сети                        | `Ошибка ...: Нет доступа к сети...`           | 1    |
| Таймаут                         | `Ошибка ...: Превышен таймаут...`             | 1    |
| Битый JSON                      | `Ошибка ...: API вернул некорректный JSON...` | 1    |
| Успех (все города)              | таблица + файл                                | 0    |
| Частичный успех                 | успешные показаны, ошибки — в stderr          | 1    |

Стек-трейс пользователю не показывается. `unhandledRejection` нет.

## Структура проекта

```text
src/
  index.js            # разбор аргументов и запуск, exit codes
  config.js           # env-конфиг
  cli/args.js         # parseArgs, валидация, --help
  api/client.js       # fetch + AbortController, URL/URLSearchParams, geocode + forecast
  api/errors.js       # CityNotFound, Http, Timeout, Network, JsonParse
  services/weather.js # Promise.allSettled, кэш-интеграция
  storage/cache.js    # fs/promises + path, reports/{city}-{date}.json
  format/output.js    # console.table вывод
docs/postman/         # Postman-коллекция с примерами
public/               # HTML-просмотр отчёта (бонус)
tests/                # базовые тесты (бонус)
Dockerfile            # (бонус)
```

## Postman

Коллекция: `docs/postman/collection.json`.
Переменные: `{{geocodingBaseUrl}}`, `{{forecastBaseUrl}}`, `{{city}}`, `{{lat}}`, `{{lon}}`, `{{days}}`.
Примеры: успех 200, «город не найден» 200 с пустым `results`, ошибка 400.

## Бонус

### Docker

```bash
docker build -t weather-digest .
docker run --rm weather-digest --help
docker run --rm -e REQUEST_TIMEOUT_MS=5000 weather-digest --city "Москва" --days 2
docker run --rm -e REPORTS_DIR=/tmp/reports weather-digest --city "Казань" --days 1
```

Параметры передаются через переменные окружения (`-e`).

- `npm run lint`, `npm run format:check`
- `public/index.html` — просмотр JSON-отчёта через DOM API
- `npm test` — парсинг daily + ошибки
