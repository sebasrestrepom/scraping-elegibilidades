require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { FIRST_MEDICAL_USER_EMAIL, FIRST_MEDICAL_USER_PASSWORD, FIRST_MEDICAL_URL } = process.env;

const firstMedicalScraping = async (patient) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    // Ignorar los errores no críticos de la página
    page.on('pageerror', err => {
        console.log(`Page error: ${err.toString()}`);
    });

    // Navegar a la página
    await page.goto(FIRST_MEDICAL_URL, { waitUntil: 'networkidle2' });
    console.log('Navigated to the URL');

    // 1. Esperar a que el campo de correo esté visible y escribir el correo
    await page.waitForSelector('#username', { visible: true });
    await page.type('#username', FIRST_MEDICAL_USER_EMAIL, { delay: 100 });
    console.log('Typed email slowly');

    // 2. Oprimir el botón de "Sign in"
    await page.click('#accessBtn');
    console.log('Clicked sign in button');

    // 3. Esperar a que aparezca el campo de contraseña y escribir la contraseña
    await page.waitForSelector('#pwd', { visible: true });
    await page.type('#pwd', FIRST_MEDICAL_USER_PASSWORD, { delay: 100 });
    console.log('Typed password slowly');

    // 4. Oprimir el botón de "Sign in" nuevamente
    await page.click('#accessBtn');
    console.log('Clicked sign in button after typing password');

    // 5. Asegurar que el valor de patient cumple con las validaciones
    if (typeof patient !== 'string') {
        patient = String(patient);  // Convertir a cadena si no lo es
    }

    // 6. Esperar a que el campo #txtContract esté disponible y escribir el valor lentamente
    await page.waitForSelector('#txtContract', { visible: true });
    await page.type('#txtContract', patient, { delay: 250 });
    console.log(`Typed patient value slowly: ${patient}`);

    // 7. Esperar un breve tiempo para que la validación se procese
    await page.waitForTimeout(1000);

    // 8. Intentar hacer clic en el botón de envío
    await page.click('#btnEligSubmit');
    console.log('Clicked submit button directly');

    await page.waitForSelector('.message strong');
    const result = await page.evaluate(() => {
        const statusElement = document.querySelector('.message strong');
        return statusElement ? statusElement.textContent.trim() : null;
    });

    if (result === 'ACTIVE') {
        console.log('The status is ACTIVE.', result);
    } else {
        console.log('The status is not ACTIVE.');
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today);
    const day = today.getDate().toString().padStart(2, '0');

    const yearFolder = path.join(path.resolve(__dirname, '../../../'), year.toString());

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
    

    await page.screenshot({ path: path.join(dayFolder, `${patient}.png`) });

    await page.waitForTimeout(1000);

    await browser.close();
};

module.exports = { firstMedicalScraping };