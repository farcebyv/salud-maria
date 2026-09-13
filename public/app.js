const labels = { morning: 'Al comenzar el día (en ayunas)', afternoon: 'Tarde', night: 'Noche' };
const dateInput = document.querySelector('#record-date');
let current = null;

dateInput.value = new Date().toISOString().slice(0, 10);
document.querySelector('#load-date').addEventListener('click', loadDay);

function flash(node, message, error = false) {
  node.textContent = message;
  node.classList.toggle('error', error);
  setTimeout(() => { node.textContent = ''; }, 2500);
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Ocurrió un error');
  return data;
}

function renderGlucose() {
  const host = document.querySelector('#glucose-cards'); host.innerHTML = '';
  const saved = Object.fromEntries(current.glucose.map(item => [item.period, item]));
  for (const period of Object.keys(labels)) {
    const node = document.querySelector('#glucose-template').content.cloneNode(true);
    const card = node.querySelector('article'); const record = saved[period];
    card.querySelector('h3').textContent = labels[period];
    if (period === 'morning') {
      const hint = document.createElement('p');
      hint.className = 'glucose-hint';
      hint.textContent = 'Sin horario fijo: antes de comer, cuando comienza el día.';
      card.querySelector('h3').after(hint);
    }
    card.querySelector('.glucose-value').value = record?.value_mg_dl || '';
    card.querySelector('.glucose-time').value = record?.measured_at?.slice(0, 5) || '';
    card.querySelector('.save-glucose').addEventListener('click', async () => {
      const value = Number(card.querySelector('.glucose-value').value);
      const status = card.querySelector('.status');
      if (!value) return flash(status, 'Indique un valor.', true);
      try {
        await request('/api/glucose', { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ date: current.date, period, value, time: card.querySelector('.glucose-time').value }) });
        flash(status, 'Guardado.'); await loadDay();
      } catch (err) { flash(status, err.message, true); }
    });
    host.append(node);
  }
}

async function loadHistory() {
  const records = await request('/api/history');
  document.querySelector('#history').innerHTML = records.length ? records.map(row => `<tr><td>${row.measured_on.slice(0,10).split('-').reverse().join('/')}</td><td>${labels[row.period]}</td><td>${row.value_mg_dl} mg/dL</td><td>${row.measured_at?.slice(0,5) || '—'}</td></tr>`).join('') : '<tr><td colspan="4">Aún no hay registros.</td></tr>';
}

async function loadDay() {
  try {
    current = await request(`/api/today?date=${dateInput.value}`);
    document.querySelector('#patient-info').textContent = `${current.patient.name} · Cédula ${current.patient.identification}`;
    renderGlucose(); await loadHistory();
  } catch (err) { alert(`${err.message} Consulte el README para preparar la base de datos.`); }
}
loadDay();
