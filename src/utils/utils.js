const nodemailer = require('nodemailer');

const sendMail = () => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'sebasrestrepom@gmail.com',
            pass: 'keqdgbslilplbjia'
        }
    });

    let pacientes = [
        { nombre: "Paciente 1", elegible: true },
        { nombre: "Paciente 2", elegible: false },
        { nombre: "Paciente 3", elegible: true },
        { nombre: "Paciente 4", elegible: true },
        { nombre: "Paciente 5", elegible: false },
    ];

    let liItems = pacientes.map(
        (paciente) =>
            `<li>${paciente.nombre}: ${paciente.elegible ? "Elegible" : "No elegible"
            }</li>`
    );

    let mailOptions = {
        from: "sebasrestrepom@gmail.com",
        to: "sebasrestrepom@gmail.com",
        subject: "Elegibilidad diaria completada ✅",
        priority: "high",
        html: `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <title>Informe de elegibilidad diaria</title>
            <style>
                body {
                    background-color: #f7f7f7;
                    font-family: Arial, sans-serif;
                }
                .container {
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    margin: 0 auto;
                    max-width: 800px;
                    padding: 32px;
                }
                h1 {
                    color: #333;
                    font-size: 36px;
                    margin-top: 0;
                    text-align: center;
                    text-transform: uppercase;
                }
                p {
                    color: #666;
                    font-size: 16px;
                    line-height: 24px;
                    margin-bottom: 24px;
                    text-align: justify;
                }
                ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    
                }
                li {
                    border-bottom: 1px solid #eee;
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    background-color: #F0F0F0;
                    font-size: 16px;
                    color: #333;
                } 
                li strong {
                    font-weight: bold;
                }
                li:last-child {
                    border-bottom: none;
                }
                .name {
                    color: #333;
                    font-size: 18px;
                    font-weight: bold;
                }
                .status {
                    color: #fff;
                    font-size: 14px;
                    font-weight: bold;
                    padding: 4px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .status--completed {
                    background-color: #4CAF50;
                }
                .status--pending {
                    background-color: #FFC107;
                }
                .status--rejected {
                    background-color: #F44336;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Informe de elegibilidad diaria</h1>
                <p>La elegibilidad para el día de hoy ha sido completada, estos fueron los pacientes verificados y el estado de la elegibilidad:</p>
                <ul>
                    ${liItems.join("")}
                </ul>
            </div>
        </body>
    </html>
    `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Correo electrónico enviado: ' + info.response);
        }
    });
};

module.exports = { sendMail };