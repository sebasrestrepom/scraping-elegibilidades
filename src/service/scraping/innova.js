require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('../../utils/utils');

const { USER_INNOVAMD, PASSWORD_INNOVAMD, INNOVAMD_URL, INNOVAMD_CHILHOOD_QUESTION, INNOVAMD_PET_QUESTION, INNOVAMD_CAR_QUESTION } = process.env;

const innovaScraping = async (document) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(INNOVAMD_URL);

    await page.type('#Username', USER_INNOVAMD);
    await page.type('#Password', PASSWORD_INNOVAMD);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#login-button')
    ]);

    const element = await page.$('#answer-label');
    const text = await page.evaluate(element => element.textContent, element);

    const securityQuestion = text == 'What was your childhood nickname?' ? INNOVAMD_CHILHOOD_QUESTION : text == 'Favorite pet name?' ? INNOVAMD_PET_QUESTION : INNOVAMD_CAR_QUESTION;

    await page.type('#Answer', securityQuestion);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#submit-button')
    ]);

    await page.waitForSelector('body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li:nth-child(2) > a > span');

    const elegibilityButton = await page.$('body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li:nth-child(2) > a > span');

    await page.evaluate(elegibilityButton => {
        elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForSelector('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input', { visible: true });
    
    await page.type('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input', `${document}`);

    await page.click('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > div > button');

    const result = await page.$('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div > h4');
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

    await page.waitForSelector('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div > h4');

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: path.join(dayFolder, 'innova.png') });

    await browser.close();

};

module.exports = { innovaScraping };