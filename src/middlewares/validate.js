import { ValidationError } from '../errors/index.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(new ValidationError('Некорректные данные запроса', details));
      return;
    }
    req[source] = parsed.data;
    next();
  };
}
