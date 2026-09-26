# Сервис учета заявок на обслуживание оборудования

Сервис ведет справочник оборудования производственной площадки и заявки на его обслуживание. Контролирует жизненный цикл заявки и показывает погоду на объекте перед наружными работами. Данные хранятся в Postgres 16, доступ идет через Sequelize.

## Требования

- Node.js 22 и выше
- Postgres 16
- npm
- Доступ в интернет для прогноза через Open-Meteo

## Запуск с нуля

Вариант А, локальный. Подходит для разработки: база рядом, код запускается из папки.

```bash
brew services start postgresql@16
createdb maintenance
createdb maintenance_test
cp .env.example .env
npm install
npm run db:wait
npm run db:migrate
npm run db:seed:all
npm run db:import
npm run dev
```

`db:wait` ждет готовности базы, `db:migrate` накатывает схему, `db:seed:all` заливает демоданные, `db:import` переносит остатки старого файлового хранилища, если файл еще лежит в `data/db.json`. На чистой базе без старого файла импорт молча пропускается.

Вариант Б, для проверки ментором. Один шаг поднимает базу и сервис:

```bash
cp .env.example .env
docker compose up --build
```

Сервис ждет здоровую базу через `depends_on` и стартует на `http://localhost:3000`.

Проверка после запуска:

```bash
curl http://localhost:3000/api/health
npm test
postman collection run docs/postman/collection.json -e docs/postman/environment.json
```

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

Локально держите `DB_HOST=localhost`. В compose сервис `app` переопределяет `DB_HOST=db`, переписывать `.env` под контейнер не нужно.

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

CORS разрешает только источники из CORS_ORIGINS. Для локальной разработки это localhost на 3000 и 5173, звездочки нет. Лимит запросов висит на /api и отдает 429 с заголовками лимита. Тело ограничено через BODY_LIMIT, заголовки закрыты через helmet, служебный заголовок движка выключен. Куки не используем, поэтому флаги SameSite и Secure не применимы. В production стек в ответ не попадает.

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

| Номер | Название                                             | Ссылка                                            |
| ----- | ---------------------------------------------------- | ------------------------------------------------- |
| 1     | Инфраструктура Postgres: compose, образ, подключение | https://github.com/nikgritenok/atom-case-3/pull/1 |
| 2     | Миграции схемы с первой по девятую                   | https://github.com/nikgritenok/atom-case-3/pull/2 |
| 3     | Модели и связи под схему                             | https://github.com/nikgritenok/atom-case-3/pull/3 |
| 4     | Хранилище на Postgres вместо файлов                  | https://github.com/nikgritenok/atom-case-3/pull/4 |
| 5     | Бригада, история и запчасти в транзакциях            | https://github.com/nikgritenok/atom-case-3/pull/5 |
| 6     | Отчеты по площадке и нагрузке                        | https://github.com/nikgritenok/atom-case-3/pull/6 |
| 7     | Сиды и перенос файловых данных                       | https://github.com/nikgritenok/atom-case-3/pull/7 |
| 8     | Замеры, тесты и коллекция                            | https://github.com/nikgritenok/atom-case-3/pull/8 |
