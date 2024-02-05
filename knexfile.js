// knexfile.js

module.exports = {
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'chat',
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: './migrations',
    },
};
