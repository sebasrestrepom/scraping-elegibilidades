const { checkAndProcessPatientEligibility } = require('../service/check-patient-eligibility.service');
const { sendMail } = require('../utils/utils');

const startProcess = async () => {
    await checkAndProcessPatientEligibility();
    //1. se consulta la data✅
    //const findAppointmentsForTomorrow = await findAppointmentsForTomorrow();
    //const patients = await findPatiensForToday();

    //2. se individualiza✅
    //3. se llama a cada pagina que pertenezca para hacer la elegibilidad✅
    //4. se guarda cada resultado en la db ⚠️
   // await ProcessPatient(patients);

    //5. se consulta los resultados del día para informe ⛔

    //6. se envia el email con el reporte diario✅
    //sendMail();


};

startProcess();

module.exports = { startProcess };