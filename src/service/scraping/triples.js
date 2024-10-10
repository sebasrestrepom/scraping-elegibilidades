require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const { TRIPLES_USER_EMAIL, TRIPLES_USER_PASSWORD, TRIPLES_URL } = process.env;

const triplesScraping = async (medicalPlanNumber, insuranceMedicalPlan) => {
  const sanitizedMedicalPlanNumber = medicalPlanNumber.replace(
    /^(ZUM|ZUH)/,
    ""
  );

  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  let status = 'Unknown';

  page.on("pageerror", (err) => {
    console.log(`Page error: ${err.toString()}`);
  });

  try {
    await page.goto(TRIPLES_URL, { waitUntil: "networkidle2" });

    await page.waitForSelector("#cred_userid_inputtext", { visible: true });

    await page.type("#cred_userid_inputtext", TRIPLES_USER_EMAIL, {
      delay: 100,
    });

    await page.type("#cred_password_inputtext", TRIPLES_USER_PASSWORD, {
      delay: 100,
    });

    await page.click("#cred_sign_in_button");

    await page.waitForSelector("#applicationMenu > li:nth-child(3) > a", {
      visible: true,
    });

    await page.evaluate(() => {
      const button = document.querySelector(
        "#applicationMenu > li:nth-child(3) > a"
      );
      button.click();
    });

    await page.waitForSelector("#lobModalBtn", { visible: true });

    await page.waitForTimeout(6000);

    await page.click("#lobModalBtn");

    await page.waitForSelector(
      "#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12",
      { visible: true }
    );

    await page.waitForTimeout(3000);

    if (insuranceMedicalPlan === "TSA") {
      await page.click(
        "#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(1)"
      );
    } else if (insuranceMedicalPlan === "V-SSS") {
      await page.click(
        "#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(2)"
      );
    } else if (insuranceMedicalPlan === "SSS") {
      await page.click(
        "#formAudienceSelect > div.c-modal__body > div.c-audience__selection > div > div.col-md-12 > label:nth-child(3)"
      );
    }

    await page.waitForTimeout(3000);

    await page.click("#js-selectAudienceBtn");

    await page.waitForSelector("#txtMemberId", { visible: true });

    await page.waitForTimeout(3000);

    await page.type("#txtMemberId", sanitizedMedicalPlanNumber, { delay: 100 });

    await page.click("#form0 > div:nth-child(4) > button");

    await page.waitForSelector(
      "#appMain > section > section.c-patient__overview.u-grid > div:nth-child(1) > div > div.c-patient__status-wrapper > span",
      { visible: true }
    );

    await page.waitForTimeout(3000);

    const patientStatus = await page.evaluate(() => {
      const statusElement = document.querySelector(".c-patient__status");
      return statusElement ? statusElement.textContent.trim() : null;
    });

    console.log("Estado del paciente:", patientStatus);

    if (patientStatus === "Activo") {
      status = 'Activo';

      const today = new Date();
      const year = today.getFullYear();
      const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
        today
      );
      const day = today.getDate().toString().padStart(2, "0");

      const yearFolder = path.join(
        path.resolve(__dirname, "../../../"),
        year.toString()
      );

      if (!fs.existsSync(yearFolder)) {
        fs.mkdirSync(yearFolder);
      }
      const monthFolder = path.join(yearFolder, month);
      if (!fs.existsSync(monthFolder)) {
        fs.mkdirSync(monthFolder);
      }
      const dayFolder = path.join(monthFolder, day);
      if (!fs.existsSync(dayFolder)) {
        fs.mkdirSync(dayFolder);
      }

      await page.waitForTimeout(6000);

      await page.screenshot({
        path: path.join(dayFolder, `${medicalPlanNumber}.png`),
      });
    }

    await page.waitForTimeout(1000);
  } catch (error) {
    console.error(
      `Error durante el proceso de scraping para el documento ${medicalPlanNumber}:`,
      error
    );
  } finally {
    await browser.close();
  }

  return { medicalPlanNumber, status };
};

module.exports = { triplesScraping };
