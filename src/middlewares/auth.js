import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';
import { config } from '../config/index.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token || !config.jwtSecret) {
    next(new UnauthorizedError('Требуется аутентификация'));
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      technicianId: payload.technicianId ?? null,
    };
    next();
  } catch {
    next(new UnauthorizedError('Требуется аутентификация'));
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError('Требуется аутентификация'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Недостаточно прав'));
      return;
    }
    next();
  };
}
