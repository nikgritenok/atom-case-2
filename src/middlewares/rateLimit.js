import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateWindowMs,
  max: config.rateMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Слишком много запросов, попробуйте позже',
        details: [],
        requestId: req.requestId ?? 'unknown',
      },
    });
  },
});
