import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { siteIdParam } from '../validators/sites.js';
import * as controller from '../controllers/sites.js';

const router = Router();

router.get(
  '/:id/summary',
  validate(siteIdParam, 'params'),
  controller.getSummary
);

export default router;
