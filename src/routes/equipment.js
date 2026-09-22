import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  idParam,
  equipmentCreate,
  equipmentUpdate,
  equipmentListQuery,
} from '../validators/equipment.js';
import * as controller from '../controllers/equipment.js';
import { byEquipment } from '../controllers/equipmentRequests.js';
import { weatherByEquipment } from '../controllers/weather.js';

const router = Router();

router.get('/', validate(equipmentListQuery, 'query'), controller.list);
router.post('/', validate(equipmentCreate, 'body'), controller.create);
router.get('/:id', validate(idParam, 'params'), controller.getOne);
router.patch(
  '/:id',
  validate(idParam, 'params'),
  validate(equipmentUpdate, 'body'),
  controller.update
);
router.delete('/:id', validate(idParam, 'params'), controller.remove);
router.get('/:id/requests', validate(idParam, 'params'), byEquipment);
router.get('/:id/weather', validate(idParam, 'params'), weatherByEquipment);

export default router;
