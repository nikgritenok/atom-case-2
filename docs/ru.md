# Сервис учета заявок на обслуживание оборудования

Сервис ведет справочник оборудования производственной площадки и заявки на его обслуживание. Контролирует жизненный цикл заявки и показывает погоду на объекте перед наружными работами. Данные хранятся в Postgres 16, доступ идет через Sequelize.

## Требования

- Node.js 22 и выше (`node --version`), npm
- Docker Desktop / OrbStack / Docker Engine с `docker compose` (рекомендуемый путь, база поднимается сама)
- Или свой Postgres 16 (только для локального варианта без Docker)
- Доступ в интернет для прогноза через Open-Meteo (без него эндпоинт погоды отвечает 502, остальное работает)
- Порты 3000 (сервис) и 5432 (база) свободны

## Запуск с нуля (кейс 4)

```bash
cp .env.example .env
# вписать JWT_SECRET, при желании SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD
docker compose up --build
```

```
клиент ---> nginx :80/:443 ---> api :3000 ---> postgres :5432
                  |-> /metrics (basic)      |-> /metrics ---> prometheus ---> grafana :3001 (provisioning)
```

Сервис за nginx на `http://localhost`, Grafana на `http://localhost:3001` (admin/admin по умолчанию через `GRAFANA_USER`/`GRAFANA_PASSWORD`), метрики Prometheus на внутреннем `prometheus:9090`. Приложение и база наружу не торчат. Миграции и сиды накатывает entrypoint при старте, повторный `up` ничего не дублирует.

Проверка после старта:

```bash
curl http://localhost/api/health/ready
curl -u admin:admin http://localhost/metrics | head
```

### Старый локальный вариант (без compose)

Остался для разработки, подробности ниже. Отличие кейса 4: в compose всё поднимается одной командой, локально нужен свой Postgres и ручные шаги.

### Вариант Б, локально без Docker. Для разработки

Нужен Postgres 16 рядом. Дальше команды одинаковые на macOS, Linux и Windows (PowerShell), отличается только установка и старт Postgres.

1. Поставить Postgres 16:
   - macOS: `brew install postgresql@16`, затем `brew services start postgresql@16`
   - Debian/Ubuntu: `sudo apt install postgresql-16`, затем `sudo systemctl start postgresql`
   - Windows: установщик с postgresql.org (EDB), служба стартует сама; команды ниже выполнять в PowerShell
2. Создать роль и базы под значения из `.env`:

```bash
cp .env.example .env
psql -U postgres -h localhost -c "CREATE ROLE app WITH LOGIN PASSWORD 'app' CREATEDB;"
psql -U postgres -h localhost -c "CREATE DATABASE maintenance OWNER app;"
psql -U postgres -h localhost -c "CREATE DATABASE maintenance_test OWNER app;"
```

Если Postgres уже настроен под другого пользователя, поправьте `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_NAME_TEST` в `.env` вместо создания роли. 3. Поднять окружение и сервис из корня проекта:

```bash
npm install
npm run db:wait
npm run db:migrate
npm run db:seed:all
npm run db:import
npm run dev
```

Назначение шагов: `db:wait` ждет готовности базы, `db:migrate` накатывает схему в `DB_NAME`, `db:seed:all` заливает демоданные, `db:import` переносит остатки старого файлового хранилища, если файл еще лежит в `data/db.json` (на чистой базе без старого файла импорт молча пропускается). Тестовая база `DB_NAME_TEST` готовится отдельно командой `npm run test:setup`, запускать `db:migrate`/`db:seed:all` под тесты руками не нужно.

### Проверка после запуска

```bash
curl http://localhost:3000/api/health
npm test
npm run postman:test
```

`npm test` ходит в `DB_NAME_TEST` (создается через `npm run test:setup`), рабочую базу не трогает. `npm run postman:test` гоняет коллекцию `docs/postman/collection.json` через newman (ставится с dev-зависимостями) и рассчитан на чистую базу со сидами: серийник генерируется уникальным на каждый прогон, id оборудования и заявки пробрасываются между запросами автоматически, `technicianId`/`sparePartId`/`siteId` по умолчанию уже заполнены id из сидов. Порядок в коллекции менять не нужно: перевод заявки в работу идет после назначения бригады, удаление созданных сущностей вынесено в папку `cleanup` в конце. Лимит 100 запросов в минуту на `/api`: полный прогон коллекции укладывается, но два запуска подряд без паузы упрутся в 429, подождите минуту.

Если `curl` висит или отвечает отказом в соединении: проверьте, что контейнер `app` в статусе Up (`docker compose ps`), и смотрите логи `docker compose logs app`. Если порт 3000 занят, остановите локальный `npm run dev` или другой сервис на этом порту.

## Переменные окружения

| Переменная           | Пример                                      | Назначение                 |
| -------------------- | ------------------------------------------- | -------------------------- |
| PORT                 | 3000                                        | Порт сервиса               |
| NODE_ENV             | development                                 | Режим работы               |
| CORS_ORIGINS         | http://localhost:3000,http://localhost:5173 | Разрешенные источники      |
| RATE_LIMIT_WINDOW_MS | 60000                                       | Окно лимита запросов       |
| RATE_LIMIT_MAX       | 100                                         | Максимум запросов в окне   |
| WEATHER_API_URL      | https://api.open-meteo.com/v1/forecast      | Прогноз погоды             |
| REQUEST_TIMEOUT_MS   | 5000                                        | Таймаут внешнего запроса   |
| WIND_THRESHOLD_MS    | 10                                          | Порог ветра для работ      |
| PRECIP_THRESHOLD_MM  | 0.5                                         | Порог осадков для работ    |
| BODY_LIMIT           | 100kb                                       | Лимит тела запроса         |
| DB_HOST              | localhost                                   | Хост базы                  |
| DB_PORT              | 5432                                        | Порт базы                  |
| DB_NAME              | maintenance                                 | Рабочая база               |
| DB_USER              | app                                         | Пользователь базы          |
| DB_PASSWORD          | app                                         | Пароль базы                |
| DB_NAME_TEST         | maintenance_test                            | База для тестов            |
| DB_POOL_MAX          | 10                                          | Верхняя граница пула       |
| DB_POOL_MIN          | 2                                           | Нижняя граница пула        |
| DB_POOL_ACQUIRE_MS   | 30000                                       | Таймаут получения коннекта |
| DB_POOL_IDLE_MS      | 10000                                       | Простой коннекта до сброса |
| JWT_SECRET           | secret                                      | Подпись access-токена      |
| JWT_ACCESS_TTL_SEC   | 900                                         | Жизнь access-токена        |
| REFRESH_TTL_DAYS     | 7                                           | Жизнь refresh-cookie       |
| LOGIN_WINDOW_MS      | 900000                                      | Окно лимита входа          |
| LOGIN_MAX            | 10                                          | Попыток входа в окне       |
| LOG_LEVEL            | debug                                       | Уровень логов              |
| SEED_ADMIN_EMAIL     |                                             | Email первого админа       |
| SEED_ADMIN_PASSWORD  |                                             | Пароль первого админа      |
| GRAFANA_USER         | admin                                       | Логин Grafana              |
| GRAFANA_PASSWORD     | admin                                       | Пароль Grafana             |

Локально держите `DB_HOST=localhost` (значение из `.env.example`). В compose `DB_HOST=db` задается через `environment` сервиса `app`, переписывать `.env` под контейнер не нужно. Остальные переменные базы тоже имеют дефолты в compose (`app`/`app`/`maintenance`), поэтому запуск работает вообще без `.env`.

Про права: в проде приложение ходит пользователем `app` без права менять схему. Миграции гоняет владелец базы, у приложения только чтение и запись данных.

## Эндпоинты

| Метод  | Путь                                | Назначение                 |
| ------ | ----------------------------------- | -------------------------- |
| GET    | /api/health                         | Проверка сервиса           |
| GET    | /api/equipment                      | Список оборудования        |
| POST   | /api/equipment                      | Создать оборудование       |
| GET    | /api/equipment/:id                  | Карточка оборудования      |
| PATCH  | /api/equipment/:id                  | Обновить оборудование      |
| DELETE | /api/equipment/:id                  | Удалить оборудование       |
| GET    | /api/equipment/:id/requests         | Заявки по объекту          |
| GET    | /api/equipment/:id/weather          | Прогноз и пригодность окна |
| GET    | /api/requests                       | Список заявок              |
| POST   | /api/requests                       | Создать заявку             |
| GET    | /api/requests/:id                   | Карточка заявки            |
| PATCH  | /api/requests/:id                   | Править заявку             |
| PATCH  | /api/requests/:id/status            | Сменить статус             |
| DELETE | /api/requests/:id                   | Удалить заявку             |
| POST   | /api/requests/:id/assignees         | Назначить бригаду целиком  |
| DELETE | /api/requests/:id/assignees/:userId | Снять специалиста с заявки |
| GET    | /api/requests/:id/history           | История статусов заявки    |
| POST   | /api/requests/:id/parts             | Списать запчасти на заявку |
| GET    | /api/requests/:id/parts             | Строки списания по заявке  |
| DELETE | /api/requests/:id/parts/:partId     | Вернуть запчасть на склад  |
| GET    | /api/sites/:id/summary              | Сводка по площадке         |
| GET    | /api/reports/equipment-load         | Нагрузка по оборудованию   |

Списки принимают фильтры, сортировку и пагинацию. Ответ списка содержит данные и мету total, page и limit. Параметр `search` ограничен 100 символами, лишнее режется валидатором.

## Модель данных

Оборудование: id, name от 3 до 100 символов, type turbine/inverter/sensor/substation, уникальный serialNumber, location с lat и lon, status operational/maintenance/fault/decommissioned, installedAt не в будущем. Плюс привязка к площадке `site_id`, мягкое удаление через `deleted_at`.

Заявка: id, equipmentId, title от 5 до 120 символов, description до 2000 символов, priority low/medium/high/critical, status new/in_progress/done/rejected, plannedAt, createdAt и updatedAt от сервера. Карточка заявки отдает вложенные `assignees` и `parts`.

Переходы статуса: new идет в in_progress или rejected, in_progress идет в done или rejected. Из done и rejected переходов нет. Левый переход дает 409. Перевод в in_progress без назначенных исполнителей тоже дает 409.

Схема в базе:

```
sites 1:N equipment 1:1 equipment_passports
equipment 1:N maintenance_requests 1:N request_status_history
maintenance_requests N:M technicians через request_assignees
maintenance_requests N:M spare_parts через request_spare_parts
```

Площадка держит код и название. Паспорт висит на оборудовании один к одному. Специалист привязывается к заявке с ролью lead или member и часами. Запчасть уходит в заявку строкой с количеством, остатки на складе уменьшаются в той же транзакции.

Таблица связей хранит только ключи и свои поля: `request_assignees` держит `role` и `hours`, `request_spare_parts` держит `qty`. Отдельных моделей ради них не заводилось, это обычные связки с полезной нагрузкой.

Схема в третьей нормальной форме: площадки вынесены из оборудования, паспорта вынесены из оборудования один к одному, специалисты вынесены из заявок, журнал статусов вынесен из заявок, связи многие ко многим живут в своих таблицах с составными ключами. Нигде нет повторяющихся групп и транзитивных зависимостей: название площадки правится в одном месте, часы бригады лежат на связи, а не на заявке.

Правила удаления:

| Связь                                          | ON DELETE | Что происходит                            |
| ---------------------------------------------- | --------- | ----------------------------------------- |
| sites -> equipment                             | RESTRICT  | Площадку с оборудованием не снести        |
| equipment -> maintenance_requests              | RESTRICT  | Оборудование с заявками не снести         |
| equipment -> equipment_passports               | CASCADE   | Паспорт уходит за оборудованием           |
| maintenance_requests -> request_status_history | CASCADE   | История чистится за заявкой               |
| maintenance_requests -> request_assignees      | CASCADE   | Назначения чистятся за заявкой            |
| maintenance_requests -> request_spare_parts    | CASCADE   | Строки списания чистятся за заявкой       |
| technicians/spare_parts -> связки              | RESTRICT  | Занятого специалиста или деталь не снести |

История статусов неизменяема: триггер `history_no_change` режет любой UPDATE и DELETE с ошибкой `История статусов неизменяема`.

## Отчеты

Сводка по площадке `GET /api/sites/:id/summary` считает один запрос: сколько заявок всего, расклад по статусам и приоритетам, средний срок закрытия в часах. Нет площадки, будет 404.

```json
{
  "data": {
    "site": {
      "id": "11111111-1111-4111-8111-000000000001",
      "name": "Северная",
      "code": "NORTH"
    },
    "total": 12,
    "closedCount": 5,
    "byStatus": { "new": 3, "in_progress": 2, "done": 5, "rejected": 2 },
    "byPriority": { "low": 2, "medium": 4, "high": 4, "critical": 2 },
    "avgCloseHours": 48.5
  }
}
```

Нагрузка по оборудованию `GET /api/reports/equipment-load?from=2024-01-01&to=2024-12-31&minRequests=2` возвращает по каждой единице число заявок, закрытые, суммарные часы бригады и дату последнего закрытия. Параметр `minRequests` режет малонагруженное, по умолчанию 0.

```json
{
  "data": [
    {
      "equipmentId": "22222222-2222-4222-8222-000000000001",
      "name": "Турбина Северная",
      "serialNumber": "SN-100",
      "requestCount": 4,
      "closedCount": 3,
      "totalHours": 26.5,
      "lastDoneAt": "2024-06-10T12:00:00.000Z"
    }
  ],
  "meta": { "total": 1 }
}
```

Оба отчета собраны параметризованными запросами через `replacements`, конкатенации ввода в SQL нет.

## Поиск и мягкое удаление

Поиск идет через `ILIKE %needle%`: по оборудованию ищет `name`, по заявкам `title` и `description`. Под него стоят GIN-индексы с `pg_trgm` (`idx_equipment_name_trgm`, `idx_requests_title_trgm`), подстрока находится даже в середине слова. Спецсимволы `%` и `_` экранируются.

Удаление мягкое: `deleted_at`, строка остается в таблице и выпадает из выборок. Уникальность серийника частичная (`uq_equipment_serial_active` только по живым строкам), поэтому серийник удаленной единицы можно переиспользовать. Обычный `DELETE /api/equipment/:id` ставит метку, повторный вызов по тому же id даст 404.

## Откат миграций

Полный откат схемы:

```bash
npm run db:migrate:undo:all
```

Восстановление обратно:

```bash
npm run db:migrate
npm run db:seed:all
```

Откат снимает все девять миграций в обратном порядке, включая снятие триггера истории, типов ENUM и расширения `pg_trgm`. Данные при этом стираются, сиды заливают демонабор заново.

## EXPLAIN

Три запроса прогнали через `EXPLAIN (ANALYZE, BUFFERS)` до и после девятой миграции. Выводы лежат в `docs/explain/before` и `docs/explain/after`. Общая картина: последовательные проходы сменились индексными.

| Запрос                         | До                                                     | После                                        |
| ------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| Поиск оборудования по имени    | Seq Scan по equipment                                  | Index Scan по `uq_equipment_serial_active`   |
| Заявки по статусу и приоритету | Seq Scan по maintenance_requests, строк отброшено 18   | Index Scan по `idx_requests_status_priority` |
| История по заявке              | Seq Scan по request_status_history, строк отброшено 39 | Index Scan по `idx_history_request_created`  |

Файлы: `docs/explain/before/equipment-search.txt`, `docs/explain/before/requests-status-priority.txt`, `docs/explain/before/history-by-request.txt` и те же имена в `docs/explain/after/`.

## Формат ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [{ "field": "priority", "message": "Недопустимый приоритет" }],
    "requestId": "b1f2c3d4"
  }
}
```

## Примеры

Создание оборудования:

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{"name":"Турбина Северная","type":"turbine","serialNumber":"SN-100","location":{"lat":55.7,"lon":37.6},"status":"operational","installedAt":"2024-05-10T00:00:00.000Z"}'
```

Дубль серийника дает 409:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Серийный номер уже занят",
    "details": [],
    "requestId": "abc123"
  }
}
```

Битое тело дает 422 со списком полей.

## Погода

Эндпоинт берет координаты оборудования и запрашивает Open-Meteo через модуль из первого кейса. Возвращает осадки и ветер на два дня плюс признак suitable. Окно пригодно если осадки не выше PRECIP_THRESHOLD_MM и ветер не выше WIND_THRESHOLD_MS. Если внешний сервис лег, вернется 502 с понятным текстом.

## Безопасность

CORS разрешает только источники из CORS_ORIGINS. Лимит запросов висит на /api и отдельный строгий на /api/auth/login (10 попыток за 15 минут), ответ 429. Пароли хранятся bcrypt-хешем с 12 раундами, в ответы и логи не попадают. Access-токен живет 15 минут, refresh едет в cookie с HttpOnly, Secure в проде и SameSite=lax.

Lax выбран чтобы top-level переходы на /api/docs не рвали сессию, а CSRF с чужих сайтов резался. Вход отвечает одинаково при несуществующем пользователе и неверном пароле.

## Структура проекта

```
src/app.js
src/server.js
src/config
src/routes
src/controllers
src/services
src/repositories
src/middlewares
src/validators
src/errors
src/db
src/db/migrations
src/db/models
src/db/seeders
scripts
docs/postman
docs/explain
tests
```

Слои идут по цепочке маршруты в контроллеры в сервисы в репозитории. Бизнес правила живут в сервисах, работа с базой только в репозиториях и моделях. Сырой SQL встречается только в двух отчетах, везде с `replacements`.

## Pull Request

Каждый PR закрыт self-review по чеклисту: контракт не сломан, миграции катаются туда и обратно, тесты зеленые.

Кейс-3 сдан одной веткой `case-3` поверх кейса-2: https://github.com/nikgritenok/atom-case-2/pull/6. Черновые PR по шагам лежат в архиве `atom-case-3` (1–9), итоговая проверка ниже по ним.

## Роли и доступ (кейс 4)

| Роль       | Права                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| viewer     | Чтение справочников, заявок, истории и отчетов                            |
| technician | Как viewer плюс создание и правка заявок, смена статуса своих назначенных |
| admin      | Всё, включая оборудование, площадки, бригады и удаление                   |

Без токена 401, без прав 403. Регистрация всегда дает viewer, повышение только через базу или сид админа.

## Мониторинг (кейс 4)

Grafana на `http://localhost:3001`, дашборд Сервис заявок поднимается сам из `deploy/grafana/dashboards/maintenance.json`. Технические панели идут из Prometheus (`http_requests_total`, latency p50/p95, доля 4xx/5xx, uptime), прикладные из Postgres (статусы, приоритеты, среднее закрытие, нагрузка, просроченные). Алерт срабатывает при доле 5xx выше 5% за 5 минут.

Интерактивная документация на `http://localhost/api/docs`, спека в `openapi/openapi.yaml`. Метрики закрыты basic auth на nginx (`admin/admin` из `deploy/nginx/htpasswd`).

## Тесты (кейс 4)

```bash
npm run test:setup
npm test
npm run test:coverage
```

Модульные лежат в `tests/auth.test.js` (переходы, бригада, матрица ролей), интеграционные там же плюс старые файлы с Bearer-токенами. Тестовый секрет задается только в `npm test`, в проде без `JWT_SECRET` сервер не стартует.

## Runbook

Логи: `docker compose logs app` (JSON в stdout, уровень через `LOG_LEVEL`, Request ID в каждой записи). Метрики: дашборд Grafana плюс `/metrics` за basic.

Упала база: `/api/health/ready` отдает 503, приложение не падает. Смотреть `docker compose logs db`, проверить volume `pgdata`, перезапустить `docker compose restart db`.

Всплеск 5xx: срабатывает алерт доли 5xx, смотреть панель latency и логи с level error, откатить последний деплой через `docker compose down` и подъем на предыдущем образе.

Диск забит: `docker system df`, чистка `docker system prune`, при потере данных поднимать из сидов заново.

Миграции: накат `npm run db:migrate`, полный откат `npm run db:migrate:undo:all`, возврат `npm run db:migrate && npm run db:seed:all`.

## ADR и ограничения

bcryptjs вместо argon2: собирается в alpine без toolchain, 12 раундов достаточно для учебного стенда. SameSite=lax вместо strict: docs открываются top-level переходом без потери сессии. Prometheus отдельным сервисом: Grafana сама не скрейпит /metrics. Refresh ротируется при каждом обновлении, старый токен умирает сразу. Exemplars requestId в histogram: подтверждено докой prom-client, registry переключён на OpenMetrics. Snakeoil-сертификат в репо только для локального стенда, прод подменяет volume с сертами.

Ограничения: один инстанс приложения (лимитер в памяти), алерт без канала доставки (виден только в Grafana).

## Бонусы

HTTPS: стенд слушает `:443` с самоподписанным сертом из `deploy/nginx/certs/`, `:80` редиректит 301 на https. Заголовки HSTS, X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy. `postman:test` ходит напрямую на `:3000` мимо nginx, под https его не переводить.

CI: `.github/workflows/ci.yml` гоняет линтер, тесты на postgres-сервисе и сборку образа на каждый PR.

Кэш: nginx кэширует GET `/api/reports/` и `/api/sites/*/summary` на 30 секунд, ключ включает токен авторизации, статус виден в `X-Cache-Status`. Инвалидация только по TTL.

Трассировка: nginx генерирует `$request_id` и шлёт `X-Request-Id`, приложение возвращает его в ответе, пишет в логи и exemplars histogram. Панель Трассировка в дашборде описывает цепочку.

Нагрузка: `npm run load` (нужен k6), сценарий только чтение, отчёт в `docs/loadtest-report.md`. Перед прогоном поднять `RATE_LIMIT_MAX`, базовый лимит для защиты.
