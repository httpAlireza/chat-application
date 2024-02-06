exports.up = function (knex) {
    return knex.schema.createTable('messages', function (table) {
        table.increments('id').primary();
        table.string('sender_username').notNullable().references('users.username');
        table.integer('session_id').unsigned().notNullable().references('sessions.id');
        table.string('data').notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table('messages', function (table) {
        table.dropColumn('session_id');
    });
};