const {
  findAppointmentsForToday,
} = require("../repository/find-appointments-for-today.repository");
const { innovaScraping } = require("./scraping/innova");
const { provinetScraping } = require("./scraping/provinet");
const { triplesScraping } = require("./scraping/triples");
const { generateReportHTML } = require("../utils/html-templates/report-template")
const { sendEmail } = require("../utils/send-email")

const checkAndProcessPatientEligibility = async () => {
  const appointmentsForToday = await findAppointmentsForToday();

  if (!appointmentsForToday) {
    return "No appointments scheduled for today";
  }

  const scrapeEligibilityResult = await scrapeEligibilityForPatients(
    appointmentsForToday
  );

  console.log(
    "reporte final para mandar correo o mandar a armar correo:",
    scrapeEligibilityResult
  );

  const { activePatients, failedPatients } = scrapeEligibilityResult;

  const reportHTML = generateReportHTML(activePatients, failedPatients);

  await sendEmail(reportHTML);

  console.log("El reporte de elegibilidad ha sido enviado por correo.");
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
  };

  const totalPatients = appointmentsForToday.length;
  let processedPatients = 0;

  const activePatients = [];
  const failedPatients = [];

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

        if (result.status === "Activo") {
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
        console.error(
          `Error processing patient ${processedPatients} of ${totalPatients}:`,
          error
        );
        failedPatients.push({
          ...patient,
          status: "Error",
          error: error.message,
        });
      }
    } else {
      console.log(
        `No scraping service found for patient: ${patient.PatientName}`
      );
      failedPatients.push({ ...patient, status: "No service found" });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const activePatientIds = new Set(
    activePatients.map((patient) => patient.sRecordNo)
  );
  const filteredFailedPatients = failedPatients.filter(
    (patient) => !activePatientIds.has(patient.sRecordNo)
  );

  console.log(`Finished processing ${totalPatients} patients.`);
  console.log(`Total Active Patients: ${activePatients.length}`);
  console.log(`Total Failed Patients: ${filteredFailedPatients.length}`);

  return {
    totalProcessed: totalPatients,
    activePatients,
    failedPatients: filteredFailedPatients,
  };
};

module.exports = { checkAndProcessPatientEligibility };
