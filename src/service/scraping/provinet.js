require("dotenv").config();
const puppeteer = require("puppeteer");
const { uploadToDrive } = require("../../utils/upload-images-to-drive")

const { USER_PROVINET, PASSWORD_PROVINET, URL_PROVINET } = process.env;

const provinetScraping = async (document) => {
  const sanitizedDocument = document.replace(/00$/, "");

  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  let status = "Unknown";

  try {
    await page.goto(URL_PROVINET);

    await page.type("#UserName", USER_PROVINET);
    await page.type("#Password", PASSWORD_PROVINET);

    await Promise.all([
      page.waitForNavigation(),
      page.click(
        "#content > div > div > div > div > div > div.acc_content.clearfix > form > div.col_full.nobottommargin > div:nth-child(1) > input"
      ),
    ]);

    await page.waitForSelector("#primary-menu > ul > li:nth-child(2) > a");

    const elegibilityButton = await page.$(
      "#primary-menu > ul > li:nth-child(2) > a"
    );

    await page.evaluate((elegibilityButton) => {
      elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForNavigation();

    const regex = /SearchFields_.+__mMemberNumber/;
    const inputs = await page.$$("input");

    const input = await Promise.all(inputs.map((el) => el.getProperty("id")))
      .then((ids) => Promise.all(ids.map((id) => id.jsonValue())))
      .then((ids) => ids.findIndex((id) => regex.test(id)))
      .then((index) => inputs[index]);

    if (input) {
      await input.focus();
      await input.type(`${sanitizedDocument}`);
    }

    await page.click(
      "#Botones > div.col-md-6.text-center > input:nth-child(1)"
    );

    await page.waitForSelector("#DataGridTable_wrapper");

    const result = await page.$(
      "#DataGridTable > tbody > tr > td:nth-child(5)"
    );
    const textResult = await page.evaluate(
      (result) => result.textContent,
      result
    );

    console.log("este es el result", textResult);

    if (textResult && textResult.toLowerCase().includes("activo")) {
      status = "Activo";
    }

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        const scrollInterval = setInterval(() => {
          if (
            window.innerHeight + window.pageYOffset >=
            document.body.scrollHeight
          ) {
            clearInterval(scrollInterval);
            resolve();
          } else {
            window.scrollBy(0, window.innerHeight);
          }
        }, 200);
      });
    });

    const screenshotBuffer = await page.screenshot({ encoding: "binary" });
    const fileName = `${document}.png`;
    const driveFile = await uploadToDrive(
      fileName,
      screenshotBuffer
    );

    if (driveFile) {
      const driveUrl = driveFile.webViewLink;
      console.log(`Archivo subido a Google Drive: ${driveUrl}`);
      return { document, status, driveUrl };
    }
  } catch (error) {
    console.error(
      `Error durante el proceso de scraping para el documento ${document}:`,
      error
    );
  } finally {
    await browser.close();
  }

  return { document, status };
};

module.exports = { provinetScraping };
