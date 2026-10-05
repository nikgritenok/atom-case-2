import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { config } from '../config/index.js';
import {
  registerService,
  loginService,
  refreshService,
  logoutService,
} from '../services/auth.js';

const credentials = z
  .object({
    email: z.string().email('Некорректный email').max(200),
    password: z.string().min(8, 'Пароль короче 8 символов').max(200),
  })
  .strip();

const router = Router();

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/api/auth',
    maxAge: config.refreshTtlDays * 24 * 60 * 60 * 1000,
  });
}

router.post(
  '/register',
  validate(credentials, 'body'),
  asyncHandler(async (req, res) => {
    const user = await registerService(req.body);
    res.status(201).json({ data: user });
  })
);

router.post(
  '/login',
  validate(credentials, 'body'),
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await loginService(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ data: { user, accessToken } });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await refreshService(
      req.cookies?.refreshToken
    );
    setRefreshCookie(res, refreshToken);
    res.json({ data: { user, accessToken } });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await logoutService(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(204).end();
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { User } = await import('../db/index.js');
    const user = await User.findByPk(req.user.id);
    res.json({
      data: { id: user.id, email: user.email, role: user.role },
    });
  })
);

export default router;
