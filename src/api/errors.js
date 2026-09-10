/**
 * Типизированные ошибки API для понятных сообщений пользователю
 * и разного поведения при 4xx / 5xx.
 */

export class CityNotFoundError extends Error {
  constructor(city) {
    super(`Город не найден: "${city}". Проверьте название.`);
    this.name = 'CityNotFoundError';
    this.city = city;
  }
}

export class HttpError extends Error {
  constructor(status, url) {
    const kind = status >= 500 ? 'сервера' : 'запроса';
    super(`Ошибка ${kind} API: HTTP ${status} (${url})`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

export class TimeoutError extends Error {
  constructor(timeoutMs) {
    super(`Превышен таймаут запроса (${timeoutMs} мс). Попробуйте позже.`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(`Нет доступа к сети: ${message}. Проверьте соединение.`);
    this.name = 'NetworkError';
  }
}

export class JsonParseError extends Error {
  constructor() {
    super('API вернул некорректный JSON. Попробуйте позже.');
    this.name = 'JsonParseError';
  }
}
