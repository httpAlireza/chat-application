exports.up = function (knex) {
    return knex.schema.dropTable('messages');
};

exports.down = function (knex) {
    return knex.schema.createTable('messages', function(table) {
        table.increments('id');
        table.string('name');
        table.string('data');
        table.timestamps(true, true);
    });
};