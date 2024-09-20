require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { USER_INNOVAMD, PASSWORD_INNOVAMD, INNOVAMD_URL, INNOVAMD_SECURITY_QUESTION } = process.env;

const innovaScraping = async (document) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(INNOVAMD_URL);

    await page.type('#Username', USER_INNOVAMD);
    await page.type('#Password', PASSWORD_INNOVAMD);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#login-button')
    ]);

    const securityQuestion = INNOVAMD_SECURITY_QUESTION;

    await page.type('#Answer', securityQuestion);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#submit-button')
    ]);

    await page.waitForSelector('.onboarding-modal', { visible: true, timeout: 40000 });

    await page.waitForFunction(() => {
        const modal = document.querySelector('.onboarding-modal');
        const button = document.querySelector('#onboardingmodal-skip');
        return getComputedStyle(modal).opacity === '1' && getComputedStyle(button).pointerEvents !== 'none';
    }, { timeout: 10000 });

    await page.click('#onboardingmodal-skip');

    await page.waitForSelector('body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li > a > span');

    const elegibilityButton = await page.$('body > div.wrapper.ng-scope > header > nav > div.navbar-collapse.collapse > ul.nav.navbar-nav.ng-scope > li:nth-child(1) > ul > li > a > span');

    await page.evaluate(elegibilityButton => {
        elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForSelector('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input', { visible: true });
    
    await page.type('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > input', `${document}`);

    await page.click('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > form > div > div > button');

    await page.waitForSelector('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div.panel.panel-default.ng-scope > div > div > div.media-body.allow-overflow > div > div.col-xs-6.col-sm-2.col-lg-2.col-sm-text-right > h3', { visible: true, timeout: 3000 });

    const result = await page.$('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div.panel.panel-default.ng-scope > div > div > div.media-body.allow-overflow > div > div.col-xs-6.col-sm-2.col-lg-2.col-sm-text-right > h3');

    const textResult = await page.evaluate(result => result.textContent.trim(), result);

    console.log('Resultado:', textResult);

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

    await page.waitForSelector('body > div.wrapper.ng-scope > section > div > section > div > div > div > div > div > div.panel.panel-default.ng-scope > div > div > div.media-body.allow-overflow > div > div.col-xs-6.col-sm-2.col-lg-2.col-sm-text-right > h3', { visible: true });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: path.join(dayFolder, `${document}.png`) });

    await browser.close();

};

module.exports = { innovaScraping };