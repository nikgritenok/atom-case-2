import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { partsBody, partIdParam, idParam } from '../validators/requests.js';
import * as controller from '../controllers/parts.js';

const router = Router({ mergeParams: true });

router.post('/', validate(partsBody, 'body'), controller.setParts);
router.get('/', controller.getParts);
router.delete(
  '/:partId',
  validate(idParam.merge(partIdParam), 'params'),
  controller.removePart
);

export default router;
