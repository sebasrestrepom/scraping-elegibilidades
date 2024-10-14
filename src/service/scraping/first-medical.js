require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { uploadToDrive } = require("../../utils/upload-images-to-drive");

const {
  FIRST_MEDICAL_USER_EMAIL,
  FIRST_MEDICAL_USER_PASSWORD,
  FIRST_MEDICAL_URL,
} = process.env;

const firstMedicalScraping = async (contractNumber) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const downloadPath = path.resolve(__dirname);
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  }
  await page._client().send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await page.setViewport({ width: 1920, height: 1080 });

  page.on("pageerror", (err) => {
    console.log(`Page error: ${err.toString()}`);
  });

  let status = "Unknown";
  let driveUrl = null;

  try {
    await page.goto(FIRST_MEDICAL_URL, { waitUntil: "networkidle2" });

    await page.waitForSelector("#username", { visible: true });
    await page.type("#username", FIRST_MEDICAL_USER_EMAIL, { delay: 100 });

    await page.click("#accessBtn");

    await page.waitForSelector("#pwd", { visible: true });
    await page.type("#pwd", FIRST_MEDICAL_USER_PASSWORD, { delay: 100 });

    await page.click("#accessBtn");

    if (typeof contractNumber !== "string") {
      contractNumber = String(contractNumber);
    }

    await page.waitForSelector("#txtContract", { visible: true });
    await page.type("#txtContract", contractNumber, { delay: 250 });

    await page.waitForTimeout(1000);

    await page.click("#btnEligSubmit");

    await page.waitForSelector(".message strong");
    const result = await page.evaluate(() => {
      const statusElement = document.querySelector(".message strong");
      return statusElement ? statusElement.textContent.trim() : null;
    });

    if (result === "ACTIVE") {
      console.log("The status is ACTIVE.");
      status = "Activo";
    } else {
      console.log("The status is not ACTIVE.");
      status = "Inactivo";
    }

    await page.click("#EligibilityPrint > a");
    await page.waitForTimeout(10000);

    const fileName = `${contractNumber}.pdf`;
    const filePath = path.join(downloadPath, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`PDF descargado: ${filePath}`);

      const driveFile = await uploadToDrive(
        fileName,
        fs.readFileSync(filePath)
      );

      if (driveFile) {
        driveUrl = driveFile.webViewLink;
        console.log(`PDF subido a Google Drive: ${driveUrl}`);

        fs.unlinkSync(filePath);
        console.log(`Archivo local eliminado: ${filePath}`);
      }
    } else {
      console.error("El PDF no se descargó correctamente.");
    }
  } catch (error) {
    console.error(
      `Error durante el proceso de scraping para el contrato ${contractNumber}:`,
      error
    );
  } finally {
    await browser.close();
  }

  return { contractNumber, status, driveUrl };
};

module.exports = { firstMedicalScraping };
