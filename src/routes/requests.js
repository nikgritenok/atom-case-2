import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  idParam,
  requestCreate,
  requestUpdate,
  requestStatusChange,
  requestListQuery,
  assigneesBody,
  userIdParam,
} from '../validators/requests.js';
import * as controller from '../controllers/requests.js';
import partsRouter from './requestParts.js';

const router = Router();

router.get('/', validate(requestListQuery, 'query'), controller.list);
router.post('/', validate(requestCreate, 'body'), controller.create);
router.post(
  '/:id/assignees',
  validate(idParam, 'params'),
  validate(assigneesBody, 'body'),
  controller.setAssignees
);
router.delete(
  '/:id/assignees/:userId',
  validate(idParam.merge(userIdParam), 'params'),
  controller.removeAssignee
);
router.get('/:id/history', validate(idParam, 'params'), controller.getHistory);
router.use('/:id/parts', partsRouter);
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
