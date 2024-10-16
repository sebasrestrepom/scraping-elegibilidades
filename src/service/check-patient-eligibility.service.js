const {
  findAppointmentsForToday,
} = require("../repository/find-appointments-for-today.repository");
const { innovaScraping } = require("./scraping/innova");
const { firstMedicalScraping } = require("./scraping/first-medical");
const { provinetScraping } = require("./scraping/provinet");
const { triplesScraping } = require("./scraping/triples");
const { generateReportHTML } = require("../utils/html-templates/report-template");
const { sendEmail } = require("../utils/send-email");

const MAX_RETRIES = 3;

const checkAndProcessPatientEligibility = async () => {
  const appointmentsForToday = await findAppointmentsForToday();

  if (!appointmentsForToday) {
    return "No appointments scheduled for today";
  }

  const scrapeEligibilityResult = await scrapeEligibilityForPatients(appointmentsForToday);

  let { activePatients, failedPatients } = scrapeEligibilityResult;

  console.log("Primer intento finalizado. Pacientes fallidos:", failedPatients.length);

  let retryAttempt = 0;

  while (retryAttempt < MAX_RETRIES && failedPatients.length > 0) {
    retryAttempt++;
    console.log(`Intento de reintento ${retryAttempt} para pacientes fallidos.`);

    const retryResult = await scrapeEligibilityForPatients(failedPatients);

    activePatients.push(...retryResult.activePatients);
    failedPatients = retryResult.failedPatients;

    console.log(
      `Intento ${retryAttempt} finalizado. Pacientes activos adicionales: ${retryResult.activePatients.length}, Pacientes que aún fallan: ${failedPatients.length}`
    );
  }

  const finalReportHTML = generateReportHTML(activePatients, failedPatients);
  await sendEmail(finalReportHTML);
  console.log("El reporte de elegibilidad final ha sido enviado por correo.");
};

const scrapeEligibilityForPatients = async (appointmentsForToday) => {
  console.log("Inicia proceso de selector de scraping");

  const scrapingServices = {
    MMM: innovaScraping,
    PMC: innovaScraping,
    "V-MMM": innovaScraping,
    MCSC: provinetScraping,
    MCSL: provinetScraping,
    SSS: triplesScraping,
    TSA: triplesScraping,
    "V-SSS": triplesScraping,
    "APS-ADV": triplesScraping,
    "APS-TSV": triplesScraping,
    "APS-FMV": firstMedicalScraping,
  };

  const totalPatients = appointmentsForToday.length;
  let activePatients = [];
  let failedPatients = [];
  let processedPatients = 0;

  for (const patient of appointmentsForToday) {
    processedPatients++;
    console.log(
      `Processing patient ${processedPatients} of ${totalPatients}: ${patient.PatientName} with ContractNumber: ${patient.ContractNumber} and InsuranceNumber: ${patient.InsuranceNumber} and InsuranceName: ${patient.InsuranceName}`
    );

    const scrapingFunction = scrapingServices[patient.InsuranceNumber];

    if (scrapingFunction) {
      try {
        let result;
        if (scrapingFunction === triplesScraping) {
          result = await triplesScraping(
            patient.ContractNumber,
            patient.InsuranceNumber
          );
        } else {
          result = await scrapingFunction(patient.ContractNumber);
        }

        if (result.status === "Activo" && result.driveUrl) {
          const patientData = {
            ...patient,
            status: result.status,
            urlImage: result.driveUrl || null,
          };
          activePatients.push(patientData);
          console.log(`Patient ${patient.PatientName} is active.`);
        } else {
          failedPatients.push({ ...patient, status: result.status });
          console.log(`Patient ${patient.PatientName} is not eligible.`);
        }
      } catch (error) {
        console.error(`Error processing patient: ${patient.PatientName}`, error);
        failedPatients.push({
          ...patient,
          status: "Error",
          error: error.message,
        });
      }
    } else {
      console.log(`No scraping service found for patient: ${patient.PatientName}`);
      failedPatients.push({ ...patient, status: "No service found" });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { activePatients, failedPatients };
};

module.exports = { checkAndProcessPatientEligibility };
