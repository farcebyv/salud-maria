CREATE TABLE IF NOT EXISTS patient (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  identification TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  moment TEXT NOT NULL CHECK (moment IN ('fasting', 'morning', 'mid_morning', 'after_lunch', 'evening', 'after_dinner', 'bedtime')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS glucose_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  measured_on DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('morning', 'afternoon', 'night')),
  value_mg_dl INTEGER NOT NULL CHECK (value_mg_dl BETWEEN 20 AND 700),
  measured_at TIME,
  notes TEXT,
  UNIQUE(patient_id, measured_on, period)
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  medication_id INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  taken_on DATE NOT NULL,
  taken_at TIME,
  taken BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  UNIQUE(medication_id, taken_on)
);

INSERT INTO patient (name, identification, address)
SELECT U&'Mar\00EDa de los \00C1ngeles Anchia Arias', '1-0277-0286', 'San Juan de Dios de Desamparados, Super Maxi'
WHERE NOT EXISTS (SELECT 1 FROM patient WHERE identification = '1-0277-0286');

INSERT INTO medications (patient_id, name, dosage, moment, sort_order)
SELECT p.id, v.name, v.dosage, v.moment, v.sort_order
FROM patient p
CROSS JOIN (VALUES
  ('Eutirox', '1 pastilla', 'fasting', 1),
  ('Omeprazol', '1 pastilla', 'morning', 2),
  ('Soliqua 30-60', '40 unidades', 'morning', 3),
  ('Novolin simple', '6 unidades', 'morning', 4),
  ('Jardianz Duo', '1 pastilla', 'morning', 5),
  ('Hidroclorotiazida', '1 pastilla', 'morning', 6),
  ('Atenolol', '1 pastilla', 'morning', 7),
  (U&'Irbesart\00E1n', '2 pastillas', 'morning', 8),
  ('Novolin simple', '10 unidades', 'after_lunch', 9),
  ('Jardianz Duo', '1 pastilla', 'after_lunch', 10),
  ('Novolin simple', '10 unidades', 'after_dinner', 11),
  ('Lorazepam', '1 pastilla', 'bedtime', 12),
  ('Imipramina', '1 pastilla', 'bedtime', 13),
  ('Lovastatina', '1 pastilla', 'bedtime', 14)
) AS v(name, dosage, moment, sort_order)
WHERE p.identification = '1-0277-0286'
  AND NOT EXISTS (SELECT 1 FROM medications m WHERE m.patient_id = p.id);

INSERT INTO glucose_records (patient_id, measured_on, period, value_mg_dl, measured_at)
SELECT p.id, v.measured_on::date, v.period, v.value_mg_dl, v.measured_at::time
FROM patient p
CROSS JOIN (VALUES
  ('2026-09-10', 'morning', 92, '09:06'), ('2026-09-10', 'afternoon', 150, '11:59'), ('2026-09-10', 'night', 119, '19:02'),
  ('2026-09-11', 'morning', 143, '08:50'), ('2026-09-11', 'afternoon', 112, '11:47'), ('2026-09-11', 'night', 136, '18:27'),
  ('2026-09-12', 'morning', 80, '09:21'), ('2026-09-12', 'afternoon', 122, '12:10'), ('2026-09-12', 'night', 104, '18:04')
) AS v(measured_on, period, value_mg_dl, measured_at)
WHERE p.identification = '1-0277-0286'
ON CONFLICT (patient_id, measured_on, period) DO NOTHING;
