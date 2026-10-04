import { Router } from 'express';
import { requireRoles } from '../middlewares/auth.js';
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
router.post(
  '/',
  requireRoles('technician', 'admin'),
  validate(requestCreate, 'body'),
  controller.create
);
router.post(
  '/:id/assignees',
  requireRoles('admin'),
  validate(idParam, 'params'),
  validate(assigneesBody, 'body'),
  controller.setAssignees
);
router.delete(
  '/:id/assignees/:userId',
  requireRoles('admin'),
  validate(idParam.merge(userIdParam), 'params'),
  controller.removeAssignee
);
router.use('/:id/parts', partsRouter);
router.get('/:id/history', validate(idParam, 'params'), controller.getHistory);
router.get('/:id', validate(idParam, 'params'), controller.getOne);
router.patch(
  '/:id',
  requireRoles('technician', 'admin'),
  validate(idParam, 'params'),
  validate(requestUpdate, 'body'),
  controller.update
);
router.patch(
  '/:id/status',
  requireRoles('technician', 'admin'),
  validate(idParam, 'params'),
  validate(requestStatusChange, 'body'),
  controller.changeStatus
);
router.delete(
  '/:id',
  requireRoles('admin'),
  validate(idParam, 'params'),
  controller.remove
);

export default router;
