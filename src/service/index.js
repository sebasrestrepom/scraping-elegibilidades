const { findPatients } = require('../repository');
const { innovaScraping } = require('./scraping/innova');
const { intermedprScraping } = require('./scraping/intermedpr');
const { provinetScraping } = require('./scraping/provinet');
const { firstMedicalScraping } = require('./scraping/first-medical')

const findPatiensForToday = () => {
    const patient = findPatients();

    if (!patient) {
        return 'The patiend dont exists';;
    }

    return patient;
};

const ProcessPatient = async (patients) => {
    for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        console.log(patient.eps);

        if (patient.eps === 'innova') {
            await innovaScraping(patient.document);
        }

        if (patient.eps === 'intermedpr') {
            await intermedprScraping(patient.document);
        }

        if (patient.eps === 'provinet') {
            await provinetScraping(patient.document);
        }

        if (patient.eps === 'firstMedical') {
            await firstMedicalScraping(patient.document);
        }
    }
}

module.exports = { findPatiensForToday, ProcessPatient };