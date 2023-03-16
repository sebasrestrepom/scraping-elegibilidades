require('dotenv').config();

const { HOST, USER_DB, PASSWORD_DB, DATABASE_NAME } = process.env;

const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: HOST,
        user: USER_DB,
        password: PASSWORD_DB,
        database: DATABASE_NAME
    }
});

module.exports = { knex };