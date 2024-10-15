require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { uploadToDrive } = require("../../utils/upload-images-to-drive");
const axios = require("axios");

const { TRIPLES_USER_EMAIL, TRIPLES_USER_PASSWORD, TRIPLES_URL } = process.env;

const triplesScraping = async (medicalPlanNumber, insuranceMedicalPlan) => {
  const sanitizedMedicalPlanNumber = medicalPlanNumber.replace(/^(ZUM|ZUH|ZUA)/, "");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  let status = "Unknown";

  page.on("pageerror", (err) => {
    console.log(`Page error: ${err.toString()}`);
  });

  try {
    await page.goto(TRIPLES_URL, { waitUntil: "networkidle2" });

    await page.waitForSelector("#cred_userid_inputtext", { visible: true });
    await page.type("#cred_userid_inputtext", TRIPLES_USER_EMAIL, { delay: 100 });
    await page.type("#cred_password_inputtext", TRIPLES_USER_PASSWORD, { delay: 100 });
    await page.click("#cred_sign_in_button");

    await page.waitForSelector("#applicationMenu > li:nth-child(3) > a", { visible: true });
    await page.evaluate(() => {
      const button = document.querySelector("#applicationMenu > li:nth-child(3) > a");
      button.click();
    });

    await page.waitForSelector("#lobModalBtn", { visible: true });

    await page.waitForTimeout(6000);

    await page.click("#lobModalBtn");

    await page.waitForSelector("#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12", { visible: true });
    await page.waitForTimeout(3000);

    if (insuranceMedicalPlan === "TSA" || insuranceMedicalPlan === "APS-ADV") {
      await page.click("#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(1)");
    } else if (insuranceMedicalPlan === "V-SSS" || insuranceMedicalPlan === "APS-TSV") {
      await page.click("#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(2)");
    } else if (insuranceMedicalPlan === "SSS") {
      await page.click("#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(3)");
    }

    await page.waitForTimeout(3000);

    await page.click("#js-selectAudienceBtn");
    await page.waitForSelector("#txtMemberId", { visible: true });

    await page.waitForTimeout(3000);

    await page.type("#txtMemberId", sanitizedMedicalPlanNumber, { delay: 100 });
    await page.click("#form0 > div:nth-child(4) > button");

    await page.waitForTimeout(3000);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.waitForSelector("#appMain > section > section.c-patient__overview.u-grid > div:nth-child(1) > div > div.c-patient__status-wrapper > span", { visible: true });

    await page.waitForTimeout(3000);

    const patientStatus = await page.evaluate(() => {
      const statusElement = document.querySelector(".c-patient__status");
      return statusElement ? statusElement.textContent.trim() : null;
    });

    console.log("Estado del paciente:", patientStatus);

    if (patientStatus === "Activo") {
      status = "Activo";

      await new Promise((resolve) => setTimeout(resolve, 15000));

      await page.waitForSelector("#appMain > header > a.c-button.is-txtHidden-xs.c-button__secondary.has-icon", { visible: true });

      await new Promise((resolve) => setTimeout(resolve, 15000));
      const pdfUrl = await page.evaluate(() => {
        const printButton = document.querySelector("#appMain > header > a.c-button.is-txtHidden-xs.c-button__secondary.has-icon");
        return printButton ? printButton.href : null;
      });

      if (pdfUrl) {
        const cookies = await page.cookies();
        const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");

        const pdfResponse = await axios.get(pdfUrl, {
          headers: {
            Cookie: cookieHeader,
          },
          responseType: "arraybuffer",
        });

        const fileName = `${medicalPlanNumber}.pdf`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, pdfResponse.data);

        const driveFile = await uploadToDrive(fileName, pdfResponse.data);
        if (driveFile) {
          const driveUrl = driveFile.webViewLink;
          console.log(`PDF subido a Google Drive: ${driveUrl}`);
          fs.unlinkSync(filePath);
          return { medicalPlanNumber, status, driveUrl };
        }
      } else {
        console.error("No se encontró la URL del PDF.");
      }
    }
  } catch (error) {
    console.error(`Error durante el proceso de scraping para el documento ${medicalPlanNumber}:`, error);
  } finally {
    await browser.close();
  }

  return { medicalPlanNumber, status };
};

module.exports = { triplesScraping };
