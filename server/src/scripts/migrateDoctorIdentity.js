import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { config } from '../config/env.js';
import User from '../models/user.model.js';
import Doctor from '../models/doctor.model.js';
import DoctorAvailability from '../models/doctorAvailability.model.js';
import DoctorLeave from '../models/doctorLeave.model.js';
import Appointment from '../models/appointment.model.js';

const mongoUri = process.env.MONGO_URI || config.MONGO_URI || 'mongodb://localhost:27017/mediconnect';

async function runMigration() {
    console.log('Connecting to database:', mongoUri);
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully.\n');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    try {
        console.log('==================================================');
        console.log('STARTING DOCTOR IDENTITY MIGRATION');
        console.log('==================================================\n');

        // Fetch all doctors to build lookup maps
        const doctors = await Doctor.find({}).lean();
        console.log(`Found ${doctors.length} Doctor profiles.`);

        const doctorById = new Map(doctors.map((d) => [d._id.toString(), d]));
        const doctorByUserId = new Map();

        for (const doc of doctors) {
            if (doc.user) {
                const uid = doc.user.toString();
                if (doctorByUserId.has(uid)) {
                    throw new Error(`Ambiguous Doctor mapping! User._id ${uid} has multiple Doctor profiles.`);
                }
                doctorByUserId.set(uid, doc);
            }
        }

        // ====================================================
        // 1. MIGRATE DOCTOR AVAILABILITY
        // ====================================================
        console.log('\n--- 1. Migrating DoctorAvailability ---');
        const availabilities = await DoctorAvailability.find({}).lean();
        console.log(`Total DoctorAvailability documents found: ${availabilities.length}`);

        const availUpdates = [];
        for (const avail of availabilities) {
            const currentDoctorRef = avail.doctor ? avail.doctor.toString() : null;

            if (!currentDoctorRef) {
                throw new Error(`DoctorAvailability document ${avail._id} has null/missing doctor field. Aborting.`);
            }

            // Check if already a Doctor._id
            if (doctorById.has(currentDoctorRef) && !doctorByUserId.has(currentDoctorRef)) {
                console.log(`  - DoctorAvailability ${avail._id} already references Doctor._id (${currentDoctorRef}). Skipping.`);
                continue;
            }

            // Resolve by User._id
            const doctorProfile = doctorByUserId.get(currentDoctorRef);
            if (!doctorProfile) {
                throw new Error(`DoctorAvailability document ${avail._id} references User._id ${currentDoctorRef}, but no matching Doctor profile exists. Aborting.`);
            }

            availUpdates.push({
                id: avail._id,
                oldRef: currentDoctorRef,
                newRef: doctorProfile._id,
                dayOfWeek: avail.dayOfWeek,
            });
        }

        console.log(`Planned DoctorAvailability updates: ${availUpdates.length}`);
        for (const update of availUpdates) {
            console.log(`  - Updating DoctorAvailability ${update.id}: User._id (${update.oldRef}) -> Doctor._id (${update.newRef}) [day ${update.dayOfWeek}]`);
            await DoctorAvailability.updateOne(
                { _id: update.id },
                { $set: { doctor: update.newRef } }
            );
        }
        console.log(`Successfully migrated ${availUpdates.length} DoctorAvailability records.`);

        // ====================================================
        // 2. MIGRATE DOCTOR LEAVE
        // ====================================================
        console.log('\n--- 2. Migrating DoctorLeave ---');
        const leaves = await DoctorLeave.find({}).lean();
        console.log(`Total DoctorLeave documents found: ${leaves.length}`);

        const leaveUpdates = [];
        for (const leave of leaves) {
            const currentDoctorRef = leave.doctor ? leave.doctor.toString() : null;

            if (!currentDoctorRef) {
                throw new Error(`DoctorLeave document ${leave._id} has null/missing doctor field. Aborting.`);
            }

            if (doctorById.has(currentDoctorRef) && !doctorByUserId.has(currentDoctorRef)) {
                console.log(`  - DoctorLeave ${leave._id} already references Doctor._id (${currentDoctorRef}). Skipping.`);
                continue;
            }

            const doctorProfile = doctorByUserId.get(currentDoctorRef);
            if (!doctorProfile) {
                throw new Error(`DoctorLeave document ${leave._id} references User._id ${currentDoctorRef}, but no matching Doctor profile exists. Aborting.`);
            }

            leaveUpdates.push({
                id: leave._id,
                oldRef: currentDoctorRef,
                newRef: doctorProfile._id,
                date: leave.date,
            });
        }

        console.log(`Planned DoctorLeave updates: ${leaveUpdates.length}`);
        for (const update of leaveUpdates) {
            console.log(`  - Updating DoctorLeave ${update.id}: User._id (${update.oldRef}) -> Doctor._id (${update.newRef}) [date ${update.date}]`);
            await DoctorLeave.updateOne(
                { _id: update.id },
                { $set: { doctor: update.newRef } }
            );
        }
        console.log(`Successfully migrated ${leaveUpdates.length} DoctorLeave records.`);

        // ====================================================
        // 3. MIGRATE APPOINTMENTS (IF ANY LEGACY REFS EXIST)
        // ====================================================
        console.log('\n--- 3. Checking Appointments for Legacy References ---');
        const appointments = await Appointment.find({}).lean();
        console.log(`Total Appointment documents found: ${appointments.length}`);

        const appointmentUpdates = [];
        for (const apt of appointments) {
            const currentDoctorRef = apt.doctor ? apt.doctor.toString() : null;

            if (!currentDoctorRef) {
                console.warn(`  - Appointment ${apt._id} has missing doctor field.`);
                continue;
            }

            // If it's a canonical Doctor._id
            if (doctorById.has(currentDoctorRef)) {
                continue;
            }

            // Check if it's a legacy User._id
            const doctorProfile = doctorByUserId.get(currentDoctorRef);
            if (doctorProfile) {
                appointmentUpdates.push({
                    id: apt._id,
                    oldRef: currentDoctorRef,
                    newRef: doctorProfile._id,
                    date: apt.date,
                    time: apt.time,
                });
            } else {
                console.warn(`  - Appointment ${apt._id} references unknown ID ${currentDoctorRef}. Skipping.`);
            }
        }

        if (appointmentUpdates.length === 0) {
            console.log('No legacy Appointment references found. All appointments already reference canonical Doctor._id.');
        } else {
            console.log(`Planned Appointment updates: ${appointmentUpdates.length}`);
            for (const update of appointmentUpdates) {
                console.log(`  - Updating Appointment ${update.id}: User._id (${update.oldRef}) -> Doctor._id (${update.newRef})`);
                await Appointment.updateOne(
                    { _id: update.id },
                    { $set: { doctor: update.newRef } }
                );
            }
            console.log(`Successfully migrated ${appointmentUpdates.length} Appointment records.`);
        }

        // ====================================================
        // 4. POST-MIGRATION VERIFICATION
        // ====================================================
        console.log('\n==================================================');
        console.log('POST-MIGRATION VERIFICATION');
        console.log('==================================================');

        const postAvailabilities = await DoctorAvailability.find({}).lean();
        console.log(`DoctorAvailability records: ${postAvailabilities.length} (Expected: 7)`);
        const invalidAvail = postAvailabilities.filter(
            (a) => !doctorById.has(a.doctor?.toString())
        );
        if (invalidAvail.length > 0) {
            throw new Error(`Verification failed: ${invalidAvail.length} DoctorAvailability records do not reference a valid Doctor._id!`);
        }
        console.log('  -> All DoctorAvailability records cleanly reference canonical Doctor._id.');

        const postLeaves = await DoctorLeave.find({}).lean();
        console.log(`DoctorLeave records: ${postLeaves.length} (Expected: 0)`);
        const invalidLeaves = postLeaves.filter(
            (l) => !doctorById.has(l.doctor?.toString())
        );
        if (invalidLeaves.length > 0) {
            throw new Error(`Verification failed: ${invalidLeaves.length} DoctorLeave records do not reference a valid Doctor._id!`);
        }
        console.log('  -> All DoctorLeave records cleanly reference canonical Doctor._id.');

        const postAppointments = await Appointment.find({}).lean();
        console.log(`Appointment records: ${postAppointments.length} (Expected: 2)`);
        const invalidApts = postAppointments.filter(
            (a) => !doctorById.has(a.doctor?.toString())
        );
        if (invalidApts.length > 0) {
            throw new Error(`Verification failed: ${invalidApts.length} Appointment records do not reference a valid Doctor._id!`);
        }
        console.log('  -> All Appointment records cleanly reference canonical Doctor._id.');

        console.log('\nMigration completed successfully and verified.\n');
    } catch (err) {
        console.error('Migration error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed.');
    }
}

runMigration();
