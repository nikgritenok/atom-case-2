import sequelize from './sequelize.js';
import { applyAssociations } from './associations.js';
import { initSite } from './models/site.js';
import { initTechnician } from './models/technician.js';
import { initEquipment } from './models/equipment.js';
import { initEquipmentPassport } from './models/equipmentPassport.js';
import { initMaintenanceRequest } from './models/maintenanceRequest.js';
import { initRequestStatusHistory } from './models/requestStatusHistory.js';
import { initRequestAssignee } from './models/requestAssignee.js';
import { initSparePart } from './models/sparePart.js';
import { initRequestSparePart } from './models/requestSparePart.js';

const Site = initSite(sequelize);
const Technician = initTechnician(sequelize);
const Equipment = initEquipment(sequelize);
const EquipmentPassport = initEquipmentPassport(sequelize);
const MaintenanceRequest = initMaintenanceRequest(sequelize);
const RequestStatusHistory = initRequestStatusHistory(sequelize);
const RequestAssignee = initRequestAssignee(sequelize);
const SparePart = initSparePart(sequelize);
const RequestSparePart = initRequestSparePart(sequelize);

applyAssociations({
  Site,
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestStatusHistory,
  Technician,
  RequestAssignee,
  SparePart,
  RequestSparePart,
});

export {
  sequelize,
  Site,
  Equipment,
  EquipmentPassport,
  MaintenanceRequest,
  RequestStatusHistory,
  Technician,
  RequestAssignee,
  SparePart,
  RequestSparePart,
};
