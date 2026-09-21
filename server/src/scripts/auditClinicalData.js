import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Appointment from '../modules/scheduling/models/appointment.model.js';
import Token from '../modules/queue/models/token.model.js';
import Consultation from '../modules/clinical/models/consultation.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediconnect';

async function auditData() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB at:', MONGO_URI);

    try {
        console.log('\n=============================================');
        console.log('CLINICAL DATA AUDIT REPORT (READ-ONLY)');
        console.log('=============================================\n');

        // Total documents
        const totalAppointments = await Appointment.countDocuments();
        const totalTokens = await Token.countDocuments();
        const totalConsultations = await Consultation.countDocuments();

        // A. Completed Appointments with clinical data
        const completedAppointmentsWithClinical = await Appointment.find({
            status: 'COMPLETED',
            $or: [
                { diagnosis: { $exists: true, $ne: '' } },
                { prescription: { $exists: true, $ne: '' } },
                { consultationNotes: { $exists: true, $ne: '' } },
                { prescriptionUrl: { $exists: true, $ne: '' } },
            ],
        });

        // B. Completed Tokens with clinical data
        const completedTokensWithClinical = await Token.find({
            status: 'COMPLETED',
            $or: [
                { diagnosis: { $exists: true, $ne: '' } },
                { prescription: { $exists: true, $ne: '' } },
                { consultationNotes: { $exists: true, $ne: '' } },
            ],
        });

        // C. Existing Consultations
        const appointmentConsultations = await Consultation.find({ originType: 'APPOINTMENT' });
        const tokenConsultations = await Consultation.find({ originType: 'TOKEN' });

        const linkedAppointmentIds = new Set(
            appointmentConsultations
                .filter((c) => c.appointment)
                .map((c) => c.appointment.toString())
        );

        const linkedTokenIds = new Set(
            tokenConsultations
                .filter((c) => c.token)
                .map((c) => c.token.toString())
        );

        // D. Records already linked to Consultation
        const appointmentsLinked = completedAppointmentsWithClinical.filter((a) =>
            linkedAppointmentIds.has(a._id.toString())
        );
        const tokensLinked = completedTokensWithClinical.filter((t) =>
            linkedTokenIds.has(t._id.toString())
        );

        // E. Legacy records with NO Consultation
        const appointmentsNeedingBackfill = completedAppointmentsWithClinical.filter(
            (a) => !linkedAppointmentIds.has(a._id.toString())
        );
        const tokensNeedingBackfill = completedTokensWithClinical.filter(
            (t) => !linkedTokenIds.has(t._id.toString())
        );

        console.log(`Total Appointments in DB: ${totalAppointments}`);
        console.log(`Total Tokens in DB: ${totalTokens}`);
        console.log(`Total Existing Consultations in DB: ${totalConsultations}`);
        console.log(`  - Appointment-origin consultations: ${appointmentConsultations.length}`);
        console.log(`  - Token-origin consultations: ${tokenConsultations.length}`);
        console.log('---------------------------------------------');
        console.log(`A. Completed Appointments with clinical data: ${completedAppointmentsWithClinical.length}`);
        console.log(`B. Completed Tokens with clinical data: ${completedTokensWithClinical.length}`);
        console.log(`C. Existing Consultation documents: ${totalConsultations}`);
        console.log(`D. Records already linked to a Consultation:`);
        console.log(`   - Appointments already linked: ${appointmentsLinked.length}`);
        console.log(`   - Tokens already linked: ${tokensLinked.length}`);
        console.log(`E. Legacy records with NO Consultation (needing backfill):`);
        console.log(`   - Appointments needing backfill: ${appointmentsNeedingBackfill.length}`);
        console.log(`   - Tokens needing backfill: ${tokensNeedingBackfill.length}`);

        if (appointmentsNeedingBackfill.length > 0) {
            console.log('\nSample Appointments needing backfill:');
            appointmentsNeedingBackfill.slice(0, 3).forEach((a) => {
                console.log({
                    _id: a._id,
                    patient: a.patient,
                    doctor: a.doctor,
                    clinic: a.clinic,
                    date: a.date,
                    diagnosis: a.diagnosis,
                });
            });
        }

        if (tokensNeedingBackfill.length > 0) {
            console.log('\nSample Tokens needing backfill:');
            tokensNeedingBackfill.slice(0, 3).forEach((t) => {
                console.log({
                    _id: t._id,
                    patient: t.patient,
                    clinic: t.clinic,
                    date: t.date,
                    diagnosis: t.diagnosis,
                });
            });
        }

        console.log('\n=============================================\n');
    } finally {
        await mongoose.disconnect();
    }
}

auditData().catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
});
