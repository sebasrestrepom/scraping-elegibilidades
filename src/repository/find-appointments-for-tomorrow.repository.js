const { knex } = require('./config/sql-server-connection.config');

const findAppointmentsForTomorrow = async () => {
    try {
        const rows = await knex
            .select(
                'a.nAppointmentId',
                'a.nPatientId',
                'a.sFirstName AS PatientFirstName',
                'a.sMiddleName AS PatientMiddleName',
                'a.sLastName AS PatientLastName',
                'a.dAppointment',
                'a.sTime',
                'a.nDuration',
                'a.sPhoneNotification',
                'a.sEMailNotification',
                'a.bConfirmed',
                'a.bCancel',
                'pr.sFirstname AS DoctorFirstName',
                'pr.sLastname AS DoctorLastName',
                'pi.sCardContractNo AS MedicalPlanNumber',
                'i.sInsuranceNo AS InsuranceNumber',
                'i.sName AS InsuranceName'
            )
            .from('Appointments AS a')
            .join('AppointmentBooks AS ab', 'a.nBookID', 'ab.nBookID')
            .join('ProvRendering AS pr', 'ab.nProvRenderingID', 'pr.nProvRenderingID')
            .join('PatientInsurances AS pi', 'a.nPatientId', 'pi.nPatientID')
            .join('Insurances AS i', 'pi.nInsuranceID', 'i.nInsuranceID')
            .whereRaw('CAST(a.dAppointment AS DATE) = CAST(GETDATE() + 1 AS DATE)')
            .orderBy('a.nAppointmentId');

        return rows;
    } catch (err) {
        console.error(err);
    } finally {
        await knex.destroy();
    }
};

module.exports = { findAppointmentsForTomorrow };
