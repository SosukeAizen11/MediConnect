import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Appointment from '../modules/scheduling/models/appointment.model.js';
import Token from '../models/token.model.js';
import Doctor from '../models/doctor.model.js';
import Consultation from '../modules/clinical/models/consultation.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediconnect';

/**
 * Idempotent Clinical Consultation Backfill Script
 *
 * Scans for completed Appointments and Tokens containing clinical data that lack
 * a canonical Consultation record, and inserts the missing Consultation records.
 */
export async function runBackfill() {
    const isStandalone = mongoose.connection.readyState === 0;
    if (isStandalone) {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB at:', MONGO_URI);
    }

    const report = {
        preCounts: {
            appointmentsTotal: 0,
            tokensTotal: 0,
            consultationsTotal: 0,
            completedAppointmentsWithClinical: 0,
            completedTokensWithClinical: 0,
        },
        appointments: {
            scanned: 0,
            created: 0,
            skipped: 0,
            failed: [],
        },
        tokens: {
            scanned: 0,
            created: 0,
            skipped: 0,
            failed: [],
        },
        postCounts: {
            consultationsTotal: 0,
        },
    };

    try {
        console.log('\n=============================================');
        console.log('STARTING CLINICAL DATA BACKFILL');
        console.log('=============================================\n');

        // Pre-backfill counts
        report.preCounts.appointmentsTotal = await Appointment.countDocuments();
        report.preCounts.tokensTotal = await Token.countDocuments();
        report.preCounts.consultationsTotal = await Consultation.countDocuments();

        const completedAppointments = await Appointment.find({
            status: 'COMPLETED',
            $or: [
                { diagnosis: { $exists: true, $ne: '' } },
                { prescription: { $exists: true, $ne: '' } },
                { consultationNotes: { $exists: true, $ne: '' } },
                { prescriptionUrl: { $exists: true, $ne: '' } },
            ],
        });
        report.preCounts.completedAppointmentsWithClinical = completedAppointments.length;

        const completedTokens = await Token.find({
            status: 'COMPLETED',
            $or: [
                { diagnosis: { $exists: true, $ne: '' } },
                { prescription: { $exists: true, $ne: '' } },
                { consultationNotes: { $exists: true, $ne: '' } },
            ],
        });
        report.preCounts.completedTokensWithClinical = completedTokens.length;

        console.log('Pre-Backfill Snapshot:');
        console.log(`  - Total Consultations: ${report.preCounts.consultationsTotal}`);
        console.log(`  - Completed Appointments with clinical data: ${report.preCounts.completedAppointmentsWithClinical}`);
        console.log(`  - Completed Tokens with clinical data: ${report.preCounts.completedTokensWithClinical}`);
        console.log('---------------------------------------------\n');

        // 1. Backfill Appointments
        report.appointments.scanned = completedAppointments.length;
        for (const appt of completedAppointments) {
            try {
                // Idempotency check: Does a Consultation already exist for this appointment?
                const existing = await Consultation.findOne({ appointment: appt._id });
                if (existing) {
                    report.appointments.skipped++;
                    continue;
                }

                // Validation of required clinical fields
                if (!appt.diagnosis || !appt.diagnosis.trim()) {
                    report.appointments.failed.push({
                        id: appt._id.toString(),
                        reason: 'Missing diagnosis',
                    });
                    continue;
                }
                if (!appt.patient) {
                    report.appointments.failed.push({
                        id: appt._id.toString(),
                        reason: 'Missing patient ID',
                    });
                    continue;
                }
                if (!appt.doctor) {
                    report.appointments.failed.push({
                        id: appt._id.toString(),
                        reason: 'Missing doctor profile ID',
                    });
                    continue;
                }
                if (!appt.clinic) {
                    report.appointments.failed.push({
                        id: appt._id.toString(),
                        reason: 'Missing clinic ID',
                    });
                    continue;
                }

                const consultationDate = appt.date || (appt.createdAt ? new Date(appt.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                const completedAt = appt.updatedAt || appt.createdAt || new Date();

                await Consultation.create({
                    patient: appt.patient,
                    doctor: appt.doctor,
                    clinic: appt.clinic,
                    originType: 'APPOINTMENT',
                    appointment: appt._id,
                    diagnosis: appt.diagnosis.trim(),
                    prescription: appt.prescription || '',
                    consultationNotes: appt.consultationNotes || '',
                    prescriptionUrl: appt.prescriptionUrl || '',
                    consultationDate,
                    completedAt,
                });

                report.appointments.created++;
            } catch (err) {
                report.appointments.failed.push({
                    id: appt._id.toString(),
                    reason: err.message,
                });
            }
        }

        // 2. Backfill Tokens
        report.tokens.scanned = completedTokens.length;
        for (const token of completedTokens) {
            try {
                // Idempotency check: Does a Consultation already exist for this token?
                const existing = await Consultation.findOne({ token: token._id });
                if (existing) {
                    report.tokens.skipped++;
                    continue;
                }

                // Validation of required fields
                if (!token.diagnosis || !token.diagnosis.trim()) {
                    report.tokens.failed.push({
                        id: token._id.toString(),
                        reason: 'Missing diagnosis',
                    });
                    continue;
                }
                if (!token.patient) {
                    report.tokens.failed.push({
                        id: token._id.toString(),
                        reason: 'Missing patient ID',
                    });
                    continue;
                }
                if (!token.clinic) {
                    report.tokens.failed.push({
                        id: token._id.toString(),
                        reason: 'Missing clinic ID',
                    });
                    continue;
                }

                // Resolve doctor profile associated with this clinic
                const doctorDoc = await Doctor.findOne({ clinic: token.clinic });
                if (!doctorDoc) {
                    report.tokens.failed.push({
                        id: token._id.toString(),
                        reason: `No Doctor profile found linked to clinic ${token.clinic}`,
                    });
                    continue;
                }

                const consultationDate = token.date
                    ? new Date(token.date).toISOString().split('T')[0]
                    : new Date(token.createdAt || Date.now()).toISOString().split('T')[0];
                const completedAt = token.createdAt || new Date();

                await Consultation.create({
                    patient: token.patient,
                    doctor: doctorDoc._id,
                    clinic: token.clinic,
                    originType: 'TOKEN',
                    token: token._id,
                    diagnosis: token.diagnosis.trim(),
                    prescription: token.prescription || '',
                    consultationNotes: token.consultationNotes || '',
                    prescriptionUrl: '',
                    consultationDate,
                    completedAt,
                });

                report.tokens.created++;
            } catch (err) {
                report.tokens.failed.push({
                    id: token._id.toString(),
                    reason: err.message,
                });
            }
        }

        report.postCounts.consultationsTotal = await Consultation.countDocuments();

        console.log('Backfill Execution Summary:');
        console.log('  Appointments:');
        console.log(`    - Scanned: ${report.appointments.scanned}`);
        console.log(`    - Created: ${report.appointments.created}`);
        console.log(`    - Skipped (already existed): ${report.appointments.skipped}`);
        console.log(`    - Failed / Unmigratable: ${report.appointments.failed.length}`);
        if (report.appointments.failed.length > 0) {
            console.log('      Failures:', report.appointments.failed);
        }

        console.log('  Tokens:');
        console.log(`    - Scanned: ${report.tokens.scanned}`);
        console.log(`    - Created: ${report.tokens.created}`);
        console.log(`    - Skipped (already existed): ${report.tokens.skipped}`);
        console.log(`    - Failed / Unmigratable: ${report.tokens.failed.length}`);
        if (report.tokens.failed.length > 0) {
            console.log('      Failures:', report.tokens.failed);
        }

        console.log('---------------------------------------------');
        console.log(`Final Consultation Count: ${report.postCounts.consultationsTotal}`);
        console.log('=============================================\n');

        return report;
    } finally {
        if (isStandalone) {
            await mongoose.disconnect();
        }
    }
}

// Run if called directly from CLI
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    runBackfill().catch((err) => {
        console.error('Backfill execution failed:', err);
        process.exit(1);
    });
}
