const { knex } = require('./config/sql-server-connection.config');

const findAppointmentsForToday = async () => {
    try {
        const rows = await knex
            .select(
                'Pat.BookName',
                knex.raw('CONVERT(varchar(20), Pat.dAppointment, 101) AS AppointmentDate'),
                'Pat.sTime',
                'Pat.sRecordNo',
                'Pat.PatientName',
                'Pat.sPhoneHome',
                'Pat.sPhoneMobile',
                knex.raw("ISNULL(PatIns.sName, '') AS InsuranceName"),
                knex.raw("ISNULL(PatIns.sInsuranceNo, '') AS InsuranceNumber"),
                knex.raw("ISNULL(PatIns.sCardContractNo, '') AS ContractNumber"),
                knex.raw("ISNULL(PatIns.sCardGroup, '') AS CardGroup")
            )
            .from(function () {
                this.select(
                    'p.nPatientID',
                    'appb.sDescription AS BookName',
                    'app.dAppointment',
                    'app.sTime',
                    'p.sRecordNo',
                    knex.raw("p.sLastName + ' ' + p.sFirstName + ',' + p.sMiddleName AS PatientName"),
                    'p.sPhoneHome',
                    'p.sPhoneMobile'
                )
                    .from('Patients AS p')
                    .innerJoin('Appointments AS app', 'p.nPatientID', 'app.nPatientId')
                    .innerJoin('AppointmentBooks AS appb', 'app.nBookID', 'appb.nBookID')
                    .whereNull('app.dExpirationDate')
                    .whereNull('p.dExpirationDate')
                    .whereRaw('CAST(app.dAppointment AS DATE) = CAST(GETDATE() AS DATE)')
                    .as('Pat');
            })
            .leftJoin(function () {
                this.select(
                    'p.nPatientID',
                    'ins.sName',
                    'ins.sInsuranceNo',
                    'pins.sCardContractNo',
                    'pins.sCardGroup'
                )
                    .from('Patients AS p')
                    .leftJoin('PatientInsurances AS pins', 'p.nPatientID', 'pins.nPatientID')
                    .innerJoin('Insurances AS ins', 'pins.nInsuranceID', 'ins.nInsuranceID')
                    .where('pins.bIsPrimary', 1)
                    .whereNull('pins.dExpirationDate')
                    .as('PatIns');
            }, 'PatIns.nPatientID', 'Pat.nPatientID')
            .orderBy('Pat.dAppointment', 'desc')
            .orderBy('Pat.BookName', 'asc')
            .orderBy('Pat.PatientName', 'asc');

        return rows;
    } catch (err) {
        console.error(err);
    } finally {
        await knex.destroy();
    }
};

module.exports = { findAppointmentsForToday };
