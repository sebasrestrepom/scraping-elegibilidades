require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { USER_INTERMEDPR, PASSWORD_INTERMEDPR, URL_INTERMEDPR } = process.env;

const intermedprScraping = async (document) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(URL_INTERMEDPR);

    await page.type('#txtUsername', USER_INTERMEDPR);

    await page.click('#accessBtn');

    await page.waitForSelector('#txtPasswd');

    await page.evaluate((PASSWORD_INTERMEDPR) => {
        const passwordInput = document.querySelector('#txtPasswd');
        passwordInput.value = PASSWORD_INTERMEDPR;
    }, PASSWORD_INTERMEDPR);

    await page.waitForFunction(() => {
        const accessBtn = document.querySelector('#accessBtn');
        return accessBtn && !accessBtn.disabled;
    });

    await Promise.all([
        page.waitForNavigation(),
        page.click('#accessBtn')
    ]);

    await page.waitForSelector('#liEligibilityMedical > a > span');

    const elegibilityButton = await page.$('#liEligibilityMedical > a > span');

    await page.evaluate(elegibilityButton => {
        elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForSelector('#txtEligMemberID_Current');

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.type('#txtEligMemberID_Current', `${document}`);

    await page.click('#btnEligibility_Current');

    await page.waitForSelector('body > div.sweet-alert.showSweetAlert.visible');

    const result = await page.$('body > div.sweet-alert.showSweetAlert.visible > p');
    const textResult = await page.evaluate(result => result.textContent, result);

    console.log('este es el result', textResult);
    
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

    await page.screenshot({ path: path.join(dayFolder, 'intermedpr.png') });

    await browser.close();
};

module.exports = { intermedprScraping };