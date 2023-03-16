const { findPatiensForToday, ProcessPatient } = require('../service');
const { sendMail } = require('../utils/utils');

const patients = [
    {
        "document": 111279271500,
        "nombre": "Juan Perez",
        "fecha_nacimiento": "1990-01-01",
        "telefono": "555-5555",
        "eps": "provinet"
    },
    {
        "document": 111279271500,
        "nombre": "Maria Garcia",
        "fecha_nacimiento": "1985-05-12",
        "telefono": "444-4444",
        "eps": "intermedpr"
    },
    {
        "document": 111279271500,
        "nombre": "Pedro Sanchez",
        "fecha_nacimiento": "1982-10-20",
        "telefono": "333-3333",
        "eps": "provinet"
    },
    {
        "document": 111279271500,
        "nombre": "Ana Rodriguez",
        "fecha_nacimiento": "1995-02-28",
        "telefono": "222-2222",
        "eps": "intermedpr"
    }
];

const startProcess = async () => {
    //1. se consulta la data✅
    //const patientes = await findPatiensForToday();

    //2. se individualiza✅
    //3. se llama a cada pagina que pertenezca para hacer la elegibilidad✅
    //4. se guarda cada resultado en la db ⚠️
    await ProcessPatient(patients);

    //5. se consulta los resultados del día para informe ⛔

    //6. se envia el email con el reporte diario✅
    sendMail();


};

startProcess();

module.exports = { startProcess };