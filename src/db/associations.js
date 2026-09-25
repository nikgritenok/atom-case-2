export function applyAssociations(models) {
  const {
    Site,
    Equipment,
    EquipmentPassport,
    MaintenanceRequest,
    RequestStatusHistory,
    Technician,
    RequestAssignee,
    SparePart,
    RequestSparePart,
  } = models;

  Site.hasMany(Equipment, { foreignKey: 'siteId' });
  Equipment.belongsTo(Site, { foreignKey: 'siteId' });

  Equipment.hasOne(EquipmentPassport, { foreignKey: 'equipmentId' });
  EquipmentPassport.belongsTo(Equipment, { foreignKey: 'equipmentId' });

  Equipment.hasMany(MaintenanceRequest, { foreignKey: 'equipmentId' });
  MaintenanceRequest.belongsTo(Equipment, { foreignKey: 'equipmentId' });

  MaintenanceRequest.hasMany(RequestStatusHistory, { foreignKey: 'requestId' });
  RequestStatusHistory.belongsTo(MaintenanceRequest, {
    foreignKey: 'requestId',
  });

  MaintenanceRequest.belongsToMany(Technician, {
    through: { model: RequestAssignee, unique: false },
    foreignKey: 'requestId',
    otherKey: 'technicianId',
  });
  Technician.belongsToMany(MaintenanceRequest, {
    through: { model: RequestAssignee, unique: false },
    foreignKey: 'technicianId',
    otherKey: 'requestId',
  });

  MaintenanceRequest.belongsToMany(SparePart, {
    through: { model: RequestSparePart, unique: false },
    foreignKey: 'requestId',
    otherKey: 'sparePartId',
  });
  SparePart.belongsToMany(MaintenanceRequest, {
    through: { model: RequestSparePart, unique: false },
    foreignKey: 'sparePartId',
    otherKey: 'requestId',
  });
}
