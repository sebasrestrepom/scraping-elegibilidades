const nodemailer = require('nodemailer');

const sendEmail = async (htmlContent) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL_ADDRESS,
      pass: process.env.ADMIN_EMAIL_PASSWORD
    }
  });

  let mailOptions = {
    from: process.env.ADMIN_EMAIL_ADDRESS,
    to: process.env.EMAILS_TO_SEND_REPORT,
    subject: 'Elegibilidad diaria completada ✅',
    priority: 'high',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo electrónico enviado:', info.response);
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
  }
};

module.exports = { sendEmail };
