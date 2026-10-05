import { createHash, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../db/index.js';
import { mapDbError } from '../db/errors.js';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../errors/index.js';
import { config } from '../config/index.js';

const credentials = z
  .object({
    email: z.string().email('Некорректный email').max(200),
    password: z.string().min(8, 'Пароль короче 8 символов').max(200),
  })
  .strip();

function requireSecret() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET не задан');
  }
  return config.jwtSecret;
}

function toDTO(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    technicianId: user.technicianId ?? null,
  };
}

function signAccess(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      technicianId: user.technicianId ?? null,
    },
    requireSecret(),
    { expiresIn: config.jwtAccessTtlSec }
  );
}

function hashRefresh(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function registerService({ email, password }) {
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success) {
    throw new ValidationError(
      'Некорректные данные запроса',
      parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }))
    );
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({
      email: parsed.data.email,
      passwordHash,
      role: 'viewer',
    });
    return toDTO(user);
  } catch (err) {
    const mapped = mapDbError(err);
    if (mapped instanceof ConflictError) {
      throw new ConflictError('Пользователь уже зарегистрирован');
    }
    throw mapped;
  }
}

export async function loginService({ email, password }) {
  const parsed = credentials.safeParse({ email, password });
  if (!parsed.success) {
    throw new UnauthorizedError('Неверный email или пароль');
  }
  const user = await User.findOne({ where: { email: parsed.data.email } });
  const ok = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;
  if (!user || !ok) {
    throw new UnauthorizedError('Неверный email или пароль');
  }
  const refreshToken = randomUUID();
  user.refreshTokenHash = hashRefresh(refreshToken);
  await user.save();
  return { user: toDTO(user), accessToken: signAccess(user), refreshToken };
}

export async function refreshService(token) {
  if (!token) throw new UnauthorizedError('Неверный refresh-токен');
  const user = await User.findOne({
    where: { refreshTokenHash: hashRefresh(token) },
  });
  if (!user) throw new UnauthorizedError('Неверный refresh-токен');
  const refreshToken = randomUUID();
  user.refreshTokenHash = hashRefresh(refreshToken);
  await user.save();
  return { user: toDTO(user), accessToken: signAccess(user), refreshToken };
}

export async function logoutService(token) {
  if (!token) return;
  const user = await User.findOne({
    where: { refreshTokenHash: hashRefresh(token) },
  });
  if (!user) return;
  user.refreshTokenHash = null;
  await user.save();
}
