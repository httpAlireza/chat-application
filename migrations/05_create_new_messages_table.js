exports.up = function (knex) {
    return knex.schema.table('messages', function (table) {
        table.increments('id');
        table.integer('session_id').unsigned();
        table.foreign('session_id').references('sessions.id');
    });
};

exports.down = function (knex) {
    return knex.schema.table('messages', function (table) {
        table.dropColumn('session_id');
    });
};