const labels = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' };
const moments = {
  fasting: 'En ayunas', morning: 'Después del desayuno', mid_morning: 'Media mañana',
  after_lunch: 'Después del almuerzo', evening: 'Tarde', after_dinner: 'Después de cenar', bedtime: 'Antes de dormir'
};
const dateInput = document.querySelector('#record-date');
let current = null;

dateInput.value = new Date().toISOString().slice(0, 10);
document.querySelector('#load-date').addEventListener('click', loadDay);
document.querySelectorAll('[role="tab"]').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));

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

async function renderMedications() {
  const host = document.querySelector('#medication-groups');
  try {
    const medications = await request('/api/medications');
    const groups = medications.reduce((result, medication) => ((result[medication.moment] ||= []).push(medication), result), {});
    host.innerHTML = '';
    Object.entries(groups).forEach(([moment, items]) => {
      const section = document.createElement('section');
      section.className = `medication-group ${moment}`;
      const title = document.createElement('h3'); title.textContent = moments[moment]; section.append(title);
      items.forEach(item => {
        const article = document.createElement('article'); article.className = 'medication-reference';
        const name = document.createElement('h4'); name.textContent = item.name;
        const dosage = document.createElement('p'); dosage.textContent = item.dosage;
        article.append(name, dosage); section.append(article);
      });
      host.append(section);
    });
  } catch (err) { host.textContent = err.message; }
}

function showTab(tabName) {
  document.querySelectorAll('[role="tab"]').forEach(tab => {
    const selected = tab.dataset.tab === tabName;
    tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', selected);
  });
  document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  if (tabName === 'medications' && !document.querySelector('#medication-groups').children.length) renderMedications();
}

async function loadHistory() {
  const records = await request('/api/history');
  const history = document.querySelector('#history');
  history.innerHTML = records.length ? records.map(row => `
    <article class="history-record">
      <time class="history-date" datetime="${row.measured_on.slice(0, 10)}">${row.measured_on.slice(0, 10).split('-').reverse().join('/')}</time>
      <span class="period-pill ${row.period}">${labels[row.period]}</span>
      <strong class="history-value">${row.value_mg_dl}<small>mg/dL</small></strong>
      <span class="history-time">${row.measured_at?.slice(0, 5) || 'Sin hora'}</span>
    </article>`).join('') : '<p class="empty-history">Aún no hay registros.</p>';
}

async function loadDay() {
  try {
    current = await request(`/api/today?date=${dateInput.value}`);
    document.querySelector('#patient-info').textContent = `${current.patient.name} · Cédula ${current.patient.identification}`;
    renderGlucose(); await loadHistory();
  } catch (err) { alert(`${err.message} Consulte el README para preparar la base de datos.`); }
}
loadDay();
