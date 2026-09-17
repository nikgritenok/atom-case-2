import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  idParam,
  requestCreate,
  requestUpdate,
  requestStatusChange,
  requestListQuery,
} from '../validators/requests.js';
import * as controller from '../controllers/requests.js';

const router = Router();

router.get('/', validate(requestListQuery, 'query'), controller.list);
router.post('/', validate(requestCreate, 'body'), controller.create);
router.get('/:id', validate(idParam, 'params'), controller.getOne);
router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(requestUpdate, 'body'),
  controller.update
);
router.patch(
  '/:id/status',
  validate(idParam, 'params'),
  validate(requestStatusChange, 'body'),
  controller.changeStatus
);
router.delete('/:id', validate(idParam, 'params'), controller.remove);

export default router;
