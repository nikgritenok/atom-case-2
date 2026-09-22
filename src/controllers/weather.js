import { getEquipment } from '../services/equipment.js';
import { fetchForecast, isWorkAllowed } from '../services/weather.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const weatherByEquipment = asyncHandler(async (req, res) => {
  const equipment = await getEquipment(req.params.id);
  const forecast = await fetchForecast(
    equipment.location.lat,
    equipment.location.lon
  );
  const suitable = isWorkAllowed(forecast);
  res.json({
    data: {
      equipmentId: equipment.id,
      location: equipment.location,
      suitable,
      forecast: {
        precipitation: forecast?.daily?.precipitation_sum ?? [],
        windMax: forecast?.daily?.wind_speed_10m_max ?? [],
        time: forecast?.daily?.time ?? [],
      },
    },
  });
});
