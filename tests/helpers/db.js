export async function resetDb(sequelize) {
  await sequelize.query(
    'DROP TRIGGER IF EXISTS history_no_change ON request_status_history'
  );
  await sequelize.query('DELETE FROM request_spare_parts');
  await sequelize.query('DELETE FROM request_assignees');
  await sequelize.query('DELETE FROM request_status_history');
  await sequelize.query('DELETE FROM maintenance_requests');
  await sequelize.query('DELETE FROM equipment_passports');
  await sequelize.query('DELETE FROM equipment');
  await sequelize.query('DELETE FROM sites');
  await sequelize.query('DELETE FROM technicians');
  await sequelize.query('DELETE FROM spare_parts');
  await sequelize.query(
    'CREATE TRIGGER history_no_change BEFORE UPDATE OR DELETE ON request_status_history FOR EACH ROW EXECUTE FUNCTION prevent_history_change()'
  );
}
