# Equipment maintenance requests

A service for a production site: a catalog of equipment, maintenance requests with a status history, and a weather check before anyone schedules work outdoors.

It started as a test case and stayed a working service: migrations that run on start, JWT roles, rate limits, Prometheus metrics, Grafana dashboards and a runbook.

## What it does

- Stores equipment, passports, spare parts, sites and technicians, and links every request to a site and a unit.
- Moves a request through its lifecycle and writes each transition into a history table, so the timeline survives later edits.
- Pulls wind and precipitation from Open-Meteo for the equipment coordinates and answers whether the work window is usable over the next two days.

## Example

Create a unit:

```bash
curl -X POST http://localhost:3000/api/equipment \
  -H "Content-Type: application/json" \
  -d '{"name":"North turbine","type":"turbine","serialNumber":"SN-100"}'
```

A duplicate serial number answers 409, and every failure uses the same envelope:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Serial number already taken",
    "details": [],
    "requestId": "abc123"
  }
}
```

Malformed input answers 422 with the list of fields. Weather for a unit:

```bash
curl http://localhost:3000/api/equipment/1/weather
```

The response carries wind and precipitation for two days plus a `suitable` flag. The window is usable while precipitation stays under `PRECIP_THRESHOLD_MM` and wind under `WIND_THRESHOLD_MS`. When Open-Meteo is unavailable the endpoint answers 502 and says so instead of guessing.

## Quick start

Docker with Compose is the only requirement. Node and Postgres live inside the images.

```bash
cp .env.example .env      # JWT_SECRET, optionally SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
docker compose up --build
```

- app: http://localhost
- Grafana: http://localhost:3001, admin/admin unless you set `GRAFANA_USER` / `GRAFANA_PASSWORD`
- health: `curl http://localhost/api/health/ready`
- metrics: `curl -u admin:admin http://localhost/metrics`

Migrations and seeds run in the entrypoint, and a second `up` does not duplicate data.

## Configuration

`.env.example` documents every variable. The ones that change behaviour: `JWT_SECRET`, `JWT_ACCESS_TTL_SEC`, `REFRESH_TTL_DAYS`, `WIND_THRESHOLD_MS`, `PRECIP_THRESHOLD_MM`, `CORS_ORIGINS`, `RATE_LIMIT_MAX`, `LOGIN_MAX`. Database settings have defaults in Compose, so the stack starts without a `.env` at all. In production the app connects with an account that reads and writes data but cannot change the schema; migrations run as the owner.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET, POST | `/api/equipment` | list, create |
| GET, PATCH, DELETE | `/api/equipment/:id` | read, update, delete |
| GET | `/api/equipment/:id/requests` | requests for one unit |
| GET | `/api/equipment/:id/weather` | forecast and work window |
| GET, POST | `/api/requests` | list, create |
| GET, PATCH, DELETE | `/api/requests/:id` | read, edit, delete |
| PATCH | `/api/requests/:id/status` | transition |
| GET | `/api/requests/:id/history` | status history |
| POST | `/api/requests/:id/assignees` | assign a crew |
| DELETE | `/api/requests/:id/assignees/:userId` | remove one person |

## Tests

```bash
npm run test:setup   # test database and migrations
npm test             # five Jest suites
npm run load         # k6 profile behind the numbers in the report
```

The suites talk to a real Postgres over real HTTP. Nothing is mocked at the boundary.

## When to use it

A small maintenance team that still tracks equipment in a spreadsheet, or anyone who needs a working example of a request lifecycle with roles, metrics and a runbook. It is not multi-tenant and stops at spare parts, without procurement or warehouse accounting.

## Limitations

- One production site per deployment, no tenant isolation.
- Authentication is JWT with three roles. No SSO, no password reset.
- Weather depends on Open-Meteo: without network access that endpoint answers 502 while the rest keeps working.
- The CI workflow from the case bonus lives on the `case-4/bonus-ci` branch. `main` runs the same checks through npm scripts.

## Documentation

[`docs/ru.md`](docs/ru.md) is the full original documentation in Russian: data model, reports, soft delete and search, migration rollback, `EXPLAIN` examples, the error format, roles, monitoring and the runbook. Questions go to the Issues tab.

## Contributing

Branches, pull requests, review. Keep the test suite green before opening a PR.

## License

No license yet. Ask before reusing the code.
