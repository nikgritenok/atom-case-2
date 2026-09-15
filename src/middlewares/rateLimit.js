import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateWindowMs,
  max: config.rateMax,
  standardHeaders: true,
  legacyHeaders: false,
});
