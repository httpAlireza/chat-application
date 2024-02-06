exports.up = function (knex) {
    return knex.schema.createTable('sessions', function (table) {
        table.increments('id').primary();
        table.string('username1').notNullable();
        table.string('username2').notNullable();
        table.timestamps(true, true);
        table.foreign('username1').references('users.username');
        table.foreign('username2').references('users.username');
        table.unique(['username1', 'username2']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('sessions');
};