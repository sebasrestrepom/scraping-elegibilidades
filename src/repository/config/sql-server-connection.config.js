require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, INSTANCE_NAME } = process.env;

const knex = require('knex')({
    client: 'mssql',
    connection: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        options: {
            instanceName: INSTANCE_NAME
        }
    }
});

module.exports = { knex };
