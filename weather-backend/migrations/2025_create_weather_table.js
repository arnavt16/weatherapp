
exports.up = function(knex) {
  return knex.schema.createTable('weather', table => {
    table.increments('id').primary();
    table.string('location');
    table.date('start_date');
    table.date('end_date');
    table.text('temperature_data');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('weather');
};
