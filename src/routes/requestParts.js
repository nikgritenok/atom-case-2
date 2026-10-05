import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requireRoles } from '../middlewares/auth.js';
import { partsBody, partIdParam, idParam } from '../validators/requests.js';
import * as controller from '../controllers/parts.js';

const router = Router({ mergeParams: true });

router.post(
  '/',
  requireRoles('admin'),
  validate(partsBody, 'body'),
  controller.setParts
);
router.get('/', controller.getParts);
router.delete(
  '/:partId',
  requireRoles('admin'),
  validate(idParam.merge(partIdParam), 'params'),
  controller.removePart
);

export default router;
