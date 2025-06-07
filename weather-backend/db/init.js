const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './db/weather.db'
  },
  useNullAsDefault: true
});

(async () => {
  const exists = await knex.schema.hasTable('weather_data');
  if (!exists) {
    await knex.schema.createTable('weather_data', table => {
      table.increments('id').primary();
      table.string('location').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.any('temperature_data').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
    console.log('weather_data table created');
  } else {
    console.log('Table already exists');
  }
  process.exit(0);
})();
