import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { equipmentLoadQuery } from '../validators/reports.js';
import * as controller from '../controllers/reports.js';

const router = Router();

router.get(
  '/equipment-load',
  validate(equipmentLoadQuery, 'query'),
  controller.getLoad
);

export default router;
