require('dotenv').config();
const puppeteerExtra = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const { USER_AVAILITY, PASSWORD_AVAILITY, URL_AVAILITY, TOKEN_COOKIE } = process.env;

const availityScraping = async (document) => {
    puppeteerExtra.use(stealthPlugin());
    const browser = await puppeteerExtra.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://accounts.google.com/v3/signin/identifier?dsh=S-1392251488%3A1678768678687865&continue=https%3A%2F%2Faccounts.google.com%2F&followup=https%3A%2F%2Faccounts.google.com%2F&ifkv=AWnogHf_w8WeER1RUzm356Fy-U_TCWMz7fwWAlAH7AmjVh2Tx_YAQre2tsI_omr7r7381IzPDDyIlQ&passive=1209600&flowName=GlifWebSignIn&flowEntry=ServiceLogin');
    await page.type('#identifierId', 'sebasrestrepom@gmail.com');
    await page.click('#identifierNext > div > button > span');
    await page.waitForTimeout(1500);
    await page.waitForSelector('#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input');
    await page.type('#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input', 'password');
    await page.click('#passwordNext > div > button > span');
    await page.waitForTimeout(1500);


   /* const browser = await puppeteer.launch({ headless: false });

    const page = await browser.newPage();

    await page.setCookie(cookie);

    await page.goto(URL_AVAILITY);

    await page.type('#userId', USER_AVAILITY);
    await page.type('#password', PASSWORD_AVAILITY);

    await Promise.all([
        page.waitForNavigation(),
        page.click('#loginFormSubmit')
    ]);*/


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

    await page.screenshot({ path: path.join(dayFolder, 'availity.png') });

    //await browser.close();
};

availityScraping();



module.exports = { availityScraping };

