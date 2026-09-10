import { parseArgs, printHelp, CliError } from './cli/args.js';
import { getWeatherForCities } from './services/weather.js';
import { printReports, printCityError } from './format/output.js';

async function main() {
  let options;
  try {
    options = parseArgs(process.argv);
  } catch (err) {
    if (err instanceof CliError) {
      console.error(`Ошибка: ${err.message}`);
    } else {
      console.error(`Ошибка: ${err.message ?? err}`);
    }
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  const { results, failures } = await getWeatherForCities(options);

  for (const report of results) {
    printReports(report);
  }
  for (const { city, error } of failures) {
    printCityError(city, error);
  }

  process.exitCode = failures.length > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error(`Ошибка: ${err.message ?? err}`);
  process.exitCode = 1;
});
