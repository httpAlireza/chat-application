exports.up = function (knex) {
    return knex.schema.createTable('users', function (table) {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('password').notNullable();
      table.timestamps(true, true); // Adds 'created_at' and 'updated_at' columns
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('users');
  };