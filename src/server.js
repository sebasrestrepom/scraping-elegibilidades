require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const cron = require('node-cron');

const { PORT } = process.env;

const app = express();

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
});

//*/1 * * * *

cron.schedule('30 0 * * *', () => {
    console.log('Initiating the daily eligibility process');
    exec('node src/controller', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing the process: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
});