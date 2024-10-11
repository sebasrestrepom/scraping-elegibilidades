require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const cron = require('node-cron');

const { PORT } = process.env;

const app = express();

app.listen(PORT, () => {
    console.log(`The server is running on port ${PORT}`);
});

cron.schedule('* * * * *', () => {
    console.log('Initiating the daily eligibility process');

    const process = spawn('node', ['src/controller/check-patient-eligibility.controller']);

    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data.toString()}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
    });

    process.on('close', (code) => {
        console.log(`Process exited with code ${code}`);
    });
});