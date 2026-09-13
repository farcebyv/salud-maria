require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

async function maria() {
  const { rows } = await pool.query("SELECT * FROM patient WHERE identification = '1-0277-0286' LIMIT 1");
  if (!rows[0]) throw new Error('Ejecute primero db/schema.sql en PostgreSQL.');
  return rows[0];
}

app.get('/api/today', async (req, res, next) => {
  try {
    const patient = await maria();
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const { rows: glucose } = await pool.query(
      'SELECT * FROM glucose_records WHERE patient_id = $1 AND measured_on = $2',
      [patient.id, date]
    );
    res.json({ patient, date, glucose });
  } catch (error) { next(error); }
});

app.put('/api/glucose', async (req, res, next) => {
  try {
    const patient = await maria();
    const { date, period, value, time, notes = null } = req.body;
    if (!date || !['morning', 'afternoon', 'night'].includes(period) || !Number.isInteger(Number(value))) {
      return res.status(400).json({ message: 'Revise fecha, momento y valor de glucosa.' });
    }
    const { rows } = await pool.query(`INSERT INTO glucose_records (patient_id, measured_on, period, value_mg_dl, measured_at, notes)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (patient_id, measured_on, period) DO UPDATE SET value_mg_dl = EXCLUDED.value_mg_dl, measured_at = EXCLUDED.measured_at, notes = EXCLUDED.notes
      RETURNING *`, [patient.id, date, period, value, time || null, notes]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.get('/api/history', async (req, res, next) => {
  try {
    const patient = await maria();
    const { rows } = await pool.query(`SELECT measured_on, period, value_mg_dl, measured_at FROM glucose_records
      WHERE patient_id = $1 ORDER BY measured_on DESC, period LIMIT 90`, [patient.id]);
    res.json(rows);
  } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'No fue posible guardar la información.', detail: error.message });
});

app.listen(PORT, () => console.log(`Salud María disponible en http://localhost:${PORT}`));
