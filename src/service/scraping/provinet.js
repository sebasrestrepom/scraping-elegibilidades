require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { USER_PROVINET, PASSWORD_PROVINET, URL_PROVINET } = process.env;

const provinetScraping = async (document) => {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto(URL_PROVINET);

    await page.type('#UserName', USER_PROVINET);
    await page.type('#Password', PASSWORD_PROVINET);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#content > div > div > div > div > div > div.acc_content.clearfix > form > div.col_full.nobottommargin > div:nth-child(1) > input')
    ]);

    await page.waitForSelector('#primary-menu > ul > li:nth-child(2) > a');

    const elegibilityButton = await page.$('#primary-menu > ul > li:nth-child(2) > a');

    await page.evaluate(elegibilityButton => {
        elegibilityButton.click();
    }, elegibilityButton);

    await page.waitForNavigation();

    const regex = /SearchFields_.+__mMemberNumber/;
    const inputs = await page.$$('input');

    const input = await Promise.all(inputs.map(el => el.getProperty('id')))
        .then(ids => Promise.all(ids.map(id => id.jsonValue())))
        .then(ids => ids.findIndex(id => regex.test(id)))
        .then(index => inputs[index]); 

    if (input) {
        await input.focus();
        await input.type(`${document}`);
    }

    await page.click('#Botones > div.col-md-6.text-center > input:nth-child(1)');

    await page.waitForSelector('#DataGridTable_wrapper');

    const result = await page.$('#DataGridTable > tbody > tr > td:nth-child(5)');
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

    await page.evaluate(async () => {
        await new Promise(resolve => {
            const scrollInterval = setInterval(() => {
                if (window.innerHeight + window.pageYOffset >= document.body.scrollHeight) {
                    clearInterval(scrollInterval);
                    resolve();
                } else {
                    window.scrollBy(0, window.innerHeight);
                }
            }, 200);
        });
    });

    await page.screenshot({ path: path.join(dayFolder, `${document}.png`) });

    await browser.close();
};

module.exports = { provinetScraping };