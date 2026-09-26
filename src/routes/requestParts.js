import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { partsBody, partIdParam } from '../validators/requests.js';
import * as controller from '../controllers/parts.js';

const router = Router({ mergeParams: true });

router.post('/', validate(partsBody, 'body'), controller.setParts);
router.get('/', controller.getParts);
router.delete(
  '/:partId',
  validate(partIdParam, 'params'),
  controller.removePart
);

export default router;
