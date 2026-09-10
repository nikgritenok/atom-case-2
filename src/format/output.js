// Заглушка: будет реализовано в feat/storage-format.
export function printReports() {}
export function printCityError(city, error) {
  console.error(`Ошибка (${city}): ${error.message ?? error}`);
}
