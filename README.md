# Сервис учета заявок на обслуживание оборудования

Сервис ведет справочник оборудования производственной площадки и заявки на его обслуживание. Контролирует жизненный цикл заявки и показывает погоду на объекте перед наружными работами.

## Требования

- Node.js 20 и выше
- npm
- Доступ в интернет для прогноза через Open-Meteo

## Установка и запуск

```bash
git clone https://github.com/nikgritenok/atom-case-2.git
cd atom-case-2
npm install
cp .env.example .env
npm run dev
```

Проверка:

```bash
curl http://localhost:3000/api/health
npm test
postman collection run docs/postman/collection.json -e docs/postman/environment.json
```

Через Docker:

```bash
docker build -t maintenance-service .
docker run --rm -p 3000:3000 --env-file .env maintenance-service
docker compose up --build
```

## Переменные окружения

| Переменная | Пример | Назначение |
| --- | --- | --- |
| PORT | 3000 | Порт сервиса |
| NODE_ENV | development | Режим работы |
| CORS_ORIGINS | http://localhost:3000,http://localhost:5173 | Разрешенные источники |
| RATE_LIMIT_WINDOW_MS | 60000 | Окно лимита запросов |
| RATE_LIMIT_MAX | 100 | Максимум запросов в окне |
| WEATHER_API_URL | https://api.open-meteo.com/v1/forecast | Прогноз погоды |
| REQUEST_TIMEOUT_MS | 5000 | Таймаут внешнего запроса |
| WIND_THRESHOLD_MS | 10 | Порог ветра для работ |
| PRECIP_THRESHOLD_MM | 0.5 | Порог осадков для работ |
| BODY_LIMIT | 100kb | Лимит тела запроса |
| DB_PATH | data/db.json | Путь к файлу базы |

## Эндпоинты

| Метод | Путь | Назначение |
| --- | --- | --- |
| GET | /api/health | Проверка сервиса |
| GET | /api/equipment | Список оборудования |
| POST | /api/equipment | Создать оборудование |
| GET | /api/equipment/:id | Карточка оборудования |
| PATCH | /api/equipment/:id | Обновить оборудование |
| DELETE | /api/equipment/:id | Удалить оборудование |
| GET | /api/equipment/:id/requests | Заявки по объекту |
| GET | /api/equipment/:id/weather | Прогноз и пригодность окна |
| GET | /api/requests | Список заявок |
| POST | /api/requests | Создать заявку |
| GET | /api/requests/:id | Карточка заявки |
| PATCH | /api/requests/:id | Править заявку |
| PATCH | /api/requests/:id/status | Сменить статус |
| DELETE | /api/requests/:id | Удалить заявку |

Списки принимают фильтры, сортировку и пагинацию. Ответ списка содержит данные и мету total, page и limit.

## Модель данных

Оборудование: id, name от 3 до 100 символов, type turbine/inverter/sensor/substation, уникальный serialNumber, location с lat и lon, status operational/maintenance/fault/decommissioned, installedAt не в будущем.

Заявка: id, equipmentId, title от 5 до 120 символов, description до 2000 символов, priority low/medium/high/critical, status new/in_progress/done/rejected, plannedAt, createdAt и updatedAt от сервера.

Переходы статуса: new идет в in_progress или rejected, in_progress идет в done или rejected. Из done и rejected переходов нет. Левый переход дает 409.

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
docs/postman
tests
```

Слои идут по цепочке маршруты в контроллеры в сервисы в репозитории. Бизнес правила живут в сервисах, работа с файлом только в репозиториях.
