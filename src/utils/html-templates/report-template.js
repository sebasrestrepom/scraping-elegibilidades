const generateReportHTML = (activePatients, failedPatients) => {
  const convertTimeTo24HourFormat = (time) => {
    const [hour, minutePart] = time.split(":");
    const minutes = minutePart.slice(0, 2);
    const period = minutePart.slice(3).toUpperCase();

    let hour24 = parseInt(hour, 10);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return hour24 * 60 + parseInt(minutes, 10);
  };

  const sortedActivePatients = activePatients.sort(
    (a, b) => convertTimeTo24HourFormat(a.sTime) - convertTimeTo24HourFormat(b.sTime)
  );
  const sortedFailedPatients = failedPatients.sort(
    (a, b) => convertTimeTo24HourFormat(a.sTime) - convertTimeTo24HourFormat(b.sTime)
  );

  const activePatientsList = sortedActivePatients.map((patient) => {
    const imageLink = patient.urlImage
      ? `<a href="${patient.urlImage}" target="_blank">Ver Imagen</a>`
      : "Sin imagen disponible";
    return `<li class="card">
      <div class="card-header">
        <span class="name">${patient.sRecordNo} - ${patient.PatientName}</span>
      </div>
      <div class="card-body">
        <p><strong>Hora Cita:</strong> ${patient.sTime}</p>
        <p><strong>Seguro:</strong> ${patient.InsuranceName}</p>
        <p><strong>Contrato:</strong> ${patient.ContractNumber}</p>
        <p><strong>Evidencia:</strong> ${imageLink}</p>
      </div>
      <div class="status-container">
        <span class="status status--completed">${patient.status}</span>
      </div>
    </li>`;
  });

  const failedPatientsList = sortedFailedPatients.map((patient) => {
    const status = patient.status === "No service found" ? "Manual Verification" : patient.status;
    return `<li class="card">
      <div class="card-header">
        <span class="name">${patient.sRecordNo} - ${patient.PatientName}</span>
      </div>
      <div class="card-body">
        <p><strong>Hora Cita:</strong> ${patient.sTime}</p>
        <p><strong>Seguro:</strong> ${patient.InsuranceName}</p>
        <p><strong>Contrato:</strong> ${patient.ContractNumber}</p>
      </div>
      <div class="status-container">
        <span class="status status--rejected">${status}</span>
      </div>
    </li>`;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Informe de Elegibilidad Diaria</title>
        <style>
          body {
            background-color: #f4f4f4;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            margin: 2rem auto;
            max-width: 800px;
            padding: 20px;
            border-radius: 8px;
          }
          h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 20px;
            text-align: center;
            text-transform: uppercase;
          }
          p {
            color: #666;
            font-size: 14px;
            line-height: 20px;
            margin-bottom: 16px;
            text-align: justify;
          }
          h2 {
            color: #444;
            font-size: 22px;
            margin: 24px 0 16px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
          }
          ul {
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .card {
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            margin-bottom: 16px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .card-header {
            background-color: #eaeaea;
            padding: 12px;
            border-bottom: 1px solid #ddd;
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          .card-body {
            padding: 12px;
            font-size: 14px;
            color: #555;
          }
          .status-container {
            text-align: right;
            padding: 12px;
            background-color: #eaeaea;
          }
          .status {
            font-size: 12px;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .status--completed {
            background-color: #4caf50;
            color: #fff;
          }
          .status--rejected {
            background-color: #f44336;
            color: #fff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Informe de Elegibilidad Diaria</h1>
          <p>La elegibilidad para el día de hoy ha sido completada. A continuación se detalla el estado de los pacientes verificados:</p>
          <h2>Pacientes Activos</h2>
          <ul>
            ${activePatientsList.join('')}
          </ul>
          <h2>Pacientes que requieren Verificación Manual</h2>
          <ul>
            ${failedPatientsList.join('')}
          </ul>
        </div>
      </body>
    </html>
  `;
};

module.exports = { generateReportHTML };
