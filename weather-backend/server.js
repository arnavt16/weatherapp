require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './db/weather.db'
  },
  useNullAsDefault: true
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

function validRange(start, end) {
  return new Date(start) <= new Date(end);
}


app.post('/api/weather', async (req, res) => {
  console.log("DEBUG POST /api/weather:", req.body); 
  const { location, start_date, end_date, temperature_data } = req.body;
  if (
    !location ||
    !start_date ||
    !end_date ||
    !Array.isArray(temperature_data) ||
    temperature_data.length === 0
  ) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }
  if (!validRange(start_date, end_date)) {
    return res.status(400).json({ error: 'Invalid date range' });
  }
  try {
    const [id] = await knex('weather_data').insert({
      location,
      start_date,
      end_date,
      temperature_data: JSON.stringify(temperature_data)
    });
    const record = await knex('weather_data').where({ id }).first();
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/weather', async (_req, res) => {
  try {
    const rows = await knex('weather_data').orderBy('created_at', 'desc');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/weather/:id', async (req, res) => {
  const { location, start_date, end_date, temperature_data } = req.body;

  if (
    !location ||
    !start_date ||
    !end_date ||
    !Array.isArray(temperature_data) ||
    temperature_data.length === 0
  ) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const updated = await knex('weather_data')
      .where({ id: req.params.id })
      .update({
        location,
        start_date,
        end_date,
        temperature_data: JSON.stringify(temperature_data)
      });

    if (!updated) return res.status(404).json({ error: 'Not found' });

    res.json({ message: 'Weather record updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/weather/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await knex('weather_data').where({ id }).del();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const { Parser } = require('json2csv');
app.get('/api/export/csv', async (_req, res) => {
  try {
    const rows = await knex('weather_data').orderBy('created_at', 'desc');
    const fields = ['id', 'location', 'start_date', 'end_date', 'temperature_data'];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('weather_data.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


(async () => {
  const exists = await knex.schema.hasTable('weather_data');
  if (!exists) {
    await knex.schema.createTable('weather_data', table => {
      table.increments('id').primary();
      table.string('location').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.text('temperature_data').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
    console.log('Initialized SQLite database');
  }
  app.listen(PORT, () =>
    console.log(`🌤  Server running on http://localhost:${PORT}`)
  );
})();
