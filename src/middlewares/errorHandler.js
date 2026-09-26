import { config } from '../config/index.js';
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ExternalError,
} from '../errors/index.js';
import { logger } from './logger.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req.requestId ?? 'unknown';
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Внутренняя ошибка сервера';
  let details = [];

  if (err instanceof ValidationError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = err.message;
    details = err.details ?? [];
  } else if (err instanceof BadRequestError) {
    status = 400;
    code = 'BAD_REQUEST';
    message = err.message;
  } else if (err instanceof NotFoundError) {
    status = 404;
    code = 'NOT_FOUND';
    message = err.message;
  } else if (err instanceof ConflictError) {
    status = 409;
    code = 'CONFLICT';
    message = err.message;
  } else if (err instanceof ExternalError) {
    status = 502;
    code = 'EXTERNAL_ERROR';
    message = err.message;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Тело запроса слишком большое';
  } else if (err instanceof SyntaxError) {
    status = 400;
    code = 'BAD_JSON';
    message = 'Некорректный JSON в теле запроса';
  }

  if (status >= 500) {
    logger.error({ err, requestId }, 'Ошибка запроса');
  } else {
    logger.warn({ requestId, code, message }, 'Отклонен запрос');
  }

  const body = {
    error: { code, message, details, requestId },
  };

  if (config.env !== 'production' && status >= 500 && err?.stack) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
}
