/**
 * Читаемый вывод в терминал: город, страна, координаты + таблица по дням.
 */

export function printReports(report) {
  const source = report.source === 'cache' ? ' (из кэша)' : '';
  console.log(`\n${report.city}, ${report.country}${source}`);
  console.log(`Координаты: ${report.latitude}, ${report.longitude}`);
  console.log(`Прогноз на ${report.days} дн.:`);

  const rows = report.forecast.map((d) => ({
    Дата: d.date,
    'Мин °C': d.tempMin,
    'Макс °C': d.tempMax,
    'Осадки, мм': d.precipitation,
  }));
  console.table(rows);
  console.log(
    `Отчёт: reports/${report.requestedCity}-${report.fetchedAt.slice(0, 10)}.json`
  );
}

export function printCityError(city, error) {
  console.error(`Ошибка (${city}): ${error.message ?? error}`);
}
