exports.up = function (knex) {
    return knex.schema.createTable('sessions', function (table) {
        table.increments('id').primary();
        table.integer('user1_id').unsigned().notNullable();
        table.integer('user2_id').unsigned().notNullable();
        table.timestamps(true, true);
        table.foreign('user1_id').references('users.id');
        table.foreign('user2_id').references('users.id');
        table.unique(['user1_id', 'user2_id']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('sessions');
};