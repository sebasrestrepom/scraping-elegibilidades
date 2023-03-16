const { knex } = require('../connection');

const findPatients = () => {
    knex.select('name', 'lastname', 'age')
        .from('patients')
        .where('doctor', '=', 354)
        .then(rows => {
            console.log(rows);
        })
        .catch(err => {
            console.error(err);
        })
        .finally(() => {
            knex.destroy();
        });
};

module.exports = { findPatients };