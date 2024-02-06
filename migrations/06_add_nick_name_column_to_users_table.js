exports.up = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.string('nickname');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('nickname');
    });
};
