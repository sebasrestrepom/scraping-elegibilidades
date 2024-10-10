const { findAppointmentsForTomorrow } = require('../repository/find-appointments-for-tomorrow.repository');
const { innovaScraping } = require('./scraping/innova');
const { provinetScraping } = require('./scraping/provinet');
const { triplesScraping } = require('./scraping/triples')

const checkAndProcessPatientEligibility = async () => {
// 1. consulta los pacientes

const appointmentsForTomorrow = await findAppointmentsForTomorrow();

if (!appointmentsForTomorrow) {
    return 'No appointments scheduled for tomorrow';;
}

// 2. se individualiza cada paciente para empezar a procesarse uno por uno y llamar a cada pagina que pertenezca para hacer la elegibilidad

const scrapeEligibilityResult = await scrapeEligibilityForPatients(appointmentsForTomorrow);

console.log('reporte final para mandar correo o mandar a armar correo:', scrapeEligibilityResult)

// NOTAS: validar si tiene varios planes, consultar hasta que tenga uno valido o los consulto todos
// NOTAS: organizar manera de mandar a guardar las imagenes en las carpetas, deberia ser un util
// NOTAS: validar si falla una elegibilidad si se reintenta 3 veces
// NOTAS: manejar los errores de manera correcta para saber si una pagina esta fallando o cambio
// NOTAS: Hay unos registros que no tienen numero para consutlar, no debe daniar el proceso sino continuar
// NOTAS: las fotos deben subirse a DRIVE para que se puedan ver

//4. se envia el email con el reporte diario

}


const scrapeEligibilityForPatients = async (appointmentsForTomorrow) => {
    console.log('Inicia proceso de selector de scraping');

    const scrapingServices = {
        'MMM': innovaScraping,
        'PMC': innovaScraping,
        'V-MMM': innovaScraping,
        'MCSC': provinetScraping,
        'MCSL': provinetScraping,
        'SSS': triplesScraping,
        'TSA': triplesScraping,
        'V-SSS': triplesScraping
    };

    const totalPatients = appointmentsForTomorrow.length;
    let processedPatients = 0;

    const activePatients = [];
    const failedPatients = [];

    for (const patient of appointmentsForTomorrow) {
        processedPatients++;
        console.log(`Processing patient ${processedPatients} of ${totalPatients}: ${patient.PatientFirstName} ${patient.PatientLastName} with MedicalPlanNumber: ${patient.MedicalPlanNumber} and InsuranceNumber: ${patient.InsuranceNumber} and InsuranceName: ${patient.InsuranceName}`);

        const scrapingFunction = scrapingServices[patient.InsuranceNumber];

        if (scrapingFunction) {
            try {
                let result;
                if (scrapingFunction === triplesScraping) {
                    result = await triplesScraping(patient.MedicalPlanNumber, patient.InsuranceNumber);
                } else {
                    result = await scrapingFunction(patient.MedicalPlanNumber);
                }

                if (result.status === 'Activo') {
                    activePatients.push({ ...patient, status: result.status });
                    console.log(`Patient ${patient.PatientFirstName} ${patient.PatientLastName} is active.`);
                } else {
                    failedPatients.push({ ...patient, status: result.status });
                    console.log(`Patient ${patient.PatientFirstName} ${patient.PatientLastName} is not eligible.`);
                }
            } catch (error) {
                console.error(`Error processing patient ${processedPatients} of ${totalPatients}:`, error);
                failedPatients.push({ ...patient, status: 'Error', error: error.message });
            }
        } else {
            console.log(`No scraping service found for patient: ${patient.PatientFirstName} ${patient.PatientLastName}`);
            failedPatients.push({ ...patient, status: 'No service found' });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const activePatientIds = new Set(activePatients.map(patient => patient.nPatientId));
    const filteredFailedPatients = failedPatients.filter(patient => !activePatientIds.has(patient.nPatientId));

    console.log(`Finished processing ${totalPatients} patients.`);
    console.log(`Total Active Patients: ${activePatients.length}`);
    console.log(`Total Failed Patients: ${filteredFailedPatients.length}`);

    return {
        totalProcessed: totalPatients,
        activePatients,
        failedPatients: filteredFailedPatients
    };
};

module.exports = { checkAndProcessPatientEligibility };