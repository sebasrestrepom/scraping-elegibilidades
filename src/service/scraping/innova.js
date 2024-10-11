require("dotenv").config();
const puppeteer = require("puppeteer");
const { uploadToDrive } = require("../../utils/upload-images-to-drive");

const {
  USER_INNOVAMD,
  PASSWORD_INNOVAMD,
  INNOVAMD_URL,
  INNOVAMD_SECURITY_QUESTION,
} = process.env;

const innovaScraping = async (document) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  let status = "Unknown";

  try {
    await page.goto(INNOVAMD_URL);

    await page.type("#Username", USER_INNOVAMD);
    await page.type("#Password", PASSWORD_INNOVAMD);

    await Promise.all([page.waitForNavigation(), page.click("#login-button")]);

    const securityQuestion = INNOVAMD_SECURITY_QUESTION;
    await page.type("#Answer", securityQuestion);

    await Promise.all([page.waitForNavigation(), page.click("#submit-button")]);

    await page.waitForSelector(".onboarding-modal", {
      visible: true,
      timeout: 30000,
    });
    await page.waitForFunction(
      () => {
        const modal = document.querySelector(".onboarding-modal");
        const button = document.querySelector("#onboardingmodal-skip");
        return (
          getComputedStyle(modal).opacity === "1" &&
          getComputedStyle(button).pointerEvents !== "none"
        );
      },
      { timeout: 10000 }
    );

    await page.click("#onboardingmodal-skip");

    await page.waitForSelector(
      "body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li > a > span"
    );

    const elegibilityButton = await page.$(
      "body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li > a > span"
    );

    await page.evaluate((elegibilityButton) => {
      elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForSelector(
      "body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input",
      { visible: true }
    );
    await page.type(
      "body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input",
      `${document}`
    );
    await page.click(
      "body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > div > button"
    );

    let textResult;
    try {
      await page.waitForSelector(
        "body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div.panel.panel-default.ng-scope > div > div > div.media-body.allow-overflow > div > div.col-xs-6.col-sm-2.col-lg-2.col-sm-text-right > h3",
        { visible: true, timeout: 3000 }
      );

      const result = await page.$(
        "body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div.panel.panel-default.ng-scope > div > div > div.media-body.allow-overflow > div > div.col-xs-6.col-sm-2.col-lg-2.col-sm-text-right > h3"
      );
      textResult = await page.evaluate(
        (result) => result.textContent.trim(),
        result
      );

      console.log("Resultado:", textResult);
    } catch (error) {
      console.log(
        `Paciente con documento ${document} no es elegible o no se encontró la información.`
      );
    }

    if (textResult) {
      status = "Activo";

      const screenshotBuffer = await page.screenshot({ encoding: "binary" });
      const fileName = `${document}.png`;
      const driveFile = await uploadToDrive(fileName, screenshotBuffer);

      if (driveFile) {
        const driveUrl = driveFile.webViewLink;
        console.log(`Archivo subido a Google Drive: ${driveUrl}`);
        return { document, status, driveUrl };
      }
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

module.exports = { innovaScraping };
