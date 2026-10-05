import client from 'prom-client';

client.register.setContentType(client.Registry.OPENMETRICS_CONTENT_TYPE);
client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Число HTTP-запросов',
  labelNames: ['method', 'route', 'code'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Длительность обработки запросов',
  labelNames: ['method', 'route', 'code'],
  enableExemplars: true,
});

export const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Число ответов 5xx',
  labelNames: ['method', 'route', 'code'],
});

function routeOf(req) {
  return req.route?.path
    ? (req.baseUrl ?? '') + req.route.path
    : (req.path ?? 'unknown');
}

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer(
    {},
    { requestId: req.requestId ?? 'unknown' }
  );
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: routeOf(req),
      code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    end(labels);
    if (res.statusCode >= 500) httpErrorsTotal.inc(labels);
  });
  next();
}

export async function metricsHandler(_req, res) {
  res.setHeader('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}
