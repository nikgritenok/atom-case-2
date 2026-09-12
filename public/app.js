/* Отображение сохранённого JSON-отчёта средствами DOM API. Без библиотек. */

const fileInput = document.getElementById('file');
const container = document.getElementById('report');

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  container.textContent = '';

  let report;
  try {
    report = JSON.parse(await file.text());
  } catch {
    container.textContent = 'Ошибка: некорректный JSON-файл.';
    return;
  }

  const title = document.createElement('h2');
  title.textContent = `${report.city ?? report.requestedCity ?? '—'}, ${report.country ?? ''}`;
  container.appendChild(title);

  const meta = document.createElement('p');
  meta.textContent = `Координаты: ${report.latitude}, ${report.longitude}. Дней: ${report.days}.`;
  container.appendChild(meta);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const h of ['Дата', 'Мин °C', 'Макс °C', 'Осадки, мм']) {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const day of report.forecast ?? []) {
    const tr = document.createElement('tr');
    for (const v of [day.date, day.tempMin, day.tempMax, day.precipitation]) {
      const td = document.createElement('td');
      td.textContent = String(v ?? '—');
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
});
