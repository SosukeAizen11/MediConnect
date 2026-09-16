import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure env variables are loaded from root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { config } from '../config/env.js';
import User from '../models/user.model.js';
import Doctor from '../models/doctor.model.js';
import DoctorAvailability from '../modules/scheduling/models/doctorAvailability.model.js';
import DoctorLeave from '../modules/scheduling/models/doctorLeave.model.js';
import Appointment from '../modules/scheduling/models/appointment.model.js';

const mongoUri = process.env.MONGO_URI || config.MONGO_URI || 'mongodb://localhost:27017/mediconnect';

async function runAudit() {
    console.log('Connecting to database:', mongoUri);
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully.\n');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }

    try {
        // ----------------------------------------------------
        // 1. FETCH ALL RELEVANT DATA (READ-ONLY LEAN QUERIES)
        // ----------------------------------------------------
        const [users, doctors, availabilities, leaves, appointments] = await Promise.all([
            User.find({}).lean(),
            Doctor.find({}).lean(),
            DoctorAvailability.find({}).lean(),
            DoctorLeave.find({}).lean(),
            Appointment.find({}).lean(),
        ]);

        // Build index lookup maps
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));
        const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d]));

        // Map: User ID -> Array of Doctor profiles
        const doctorsByUserId = new Map();
        for (const doc of doctors) {
            if (doc.user) {
                const uid = doc.user.toString();
                if (!doctorsByUserId.has(uid)) {
                    doctorsByUserId.set(uid, []);
                }
                doctorsByUserId.get(uid).push(doc);
            }
        }

        // ----------------------------------------------------
        // 2. AUDIT DOCTORS
        // ----------------------------------------------------
        let doctorsWithValidUser = 0;
        let doctorsWithMissingUser = 0;
        const problematicDoctors = [];

        for (const doc of doctors) {
            const uid = doc.user ? doc.user.toString() : null;
            if (uid && userMap.has(uid)) {
                doctorsWithValidUser++;
            } else {
                doctorsWithMissingUser++;
                problematicDoctors.push({
                    doctorId: doc._id.toString(),
                    referencedUserId: uid,
                    reason: uid ? 'Referenced User._id does not exist in User collection' : 'Doctor record has no user field',
                });
            }
        }

        // ----------------------------------------------------
        // 3. AUDIT DOCTOR AVAILABILITY
        // ----------------------------------------------------
        let availMapped = 0;
        let availOrphaned = 0;
        let availAmbiguous = 0;
        let availAlreadyDoctorId = 0;

        // Duplicate tracking after hypothetical migration to target Doctor._id
        // Key: targetDoctorId + "_" + dayOfWeek
        const availKeyMap = new Map();
        const availDuplicateConflicts = [];
        const problematicAvailabilities = [];

        for (const avail of availabilities) {
            const docIdRef = avail.doctor ? avail.doctor.toString() : null;
            let targetDoctorId = null;

            if (!docIdRef) {
                availOrphaned++;
                problematicAvailabilities.push({
                    id: avail._id.toString(),
                    reason: 'Doctor field is missing/null',
                });
                continue;
            }

            const matchingDoctors = doctorsByUserId.get(docIdRef) || [];
            const directDoctor = doctorMap.get(docIdRef);

            if (matchingDoctors.length === 1) {
                availMapped++;
                targetDoctorId = matchingDoctors[0]._id.toString();
            } else if (matchingDoctors.length > 1) {
                availAmbiguous++;
                targetDoctorId = matchingDoctors[0]._id.toString(); // pick first for conflict analysis
                problematicAvailabilities.push({
                    id: avail._id.toString(),
                    doctorField: docIdRef,
                    matchingDoctorIds: matchingDoctors.map((d) => d._id.toString()),
                    reason: `Ambiguous: User._id maps to ${matchingDoctors.length} Doctor profiles`,
                });
            } else if (directDoctor) {
                // Already stores Doctor._id
                availAlreadyDoctorId++;
                targetDoctorId = directDoctor._id.toString();
            } else {
                availOrphaned++;
                problematicAvailabilities.push({
                    id: avail._id.toString(),
                    doctorField: docIdRef,
                    dayOfWeek: avail.dayOfWeek,
                    reason: 'Orphaned: doctor field does not match any Doctor.user nor Doctor._id',
                });
            }

            // Check potential duplicate index conflicts: { doctor, dayOfWeek }
            if (targetDoctorId !== null) {
                const key = `${targetDoctorId}_${avail.dayOfWeek}`;
                if (availKeyMap.has(key)) {
                    availKeyMap.get(key).push(avail);
                } else {
                    availKeyMap.set(key, [avail]);
                }
            }
        }

        for (const [key, records] of availKeyMap.entries()) {
            if (records.length > 1) {
                availDuplicateConflicts.push({
                    targetKey: key,
                    count: records.length,
                    recordIds: records.map((r) => r._id.toString()),
                    daysOfWeek: records.map((r) => r.dayOfWeek),
                    activeStates: records.map((r) => r.isActive),
                });
            }
        }

        // ----------------------------------------------------
        // 4. AUDIT DOCTOR LEAVE
        // ----------------------------------------------------
        let leaveMapped = 0;
        let leaveOrphaned = 0;
        let leaveAmbiguous = 0;
        let leaveAlreadyDoctorId = 0;

        // Duplicate tracking after hypothetical migration to target Doctor._id
        // Key: targetDoctorId + "_" + date
        const leaveKeyMap = new Map();
        const leaveDuplicateConflicts = [];
        const problematicLeaves = [];

        for (const leave of leaves) {
            const docIdRef = leave.doctor ? leave.doctor.toString() : null;
            let targetDoctorId = null;

            if (!docIdRef) {
                leaveOrphaned++;
                problematicLeaves.push({
                    id: leave._id.toString(),
                    reason: 'Doctor field is missing/null',
                });
                continue;
            }

            const matchingDoctors = doctorsByUserId.get(docIdRef) || [];
            const directDoctor = doctorMap.get(docIdRef);

            if (matchingDoctors.length === 1) {
                leaveMapped++;
                targetDoctorId = matchingDoctors[0]._id.toString();
            } else if (matchingDoctors.length > 1) {
                leaveAmbiguous++;
                targetDoctorId = matchingDoctors[0]._id.toString();
                problematicLeaves.push({
                    id: leave._id.toString(),
                    doctorField: docIdRef,
                    matchingDoctorIds: matchingDoctors.map((d) => d._id.toString()),
                    reason: `Ambiguous: User._id maps to ${matchingDoctors.length} Doctor profiles`,
                });
            } else if (directDoctor) {
                leaveAlreadyDoctorId++;
                targetDoctorId = directDoctor._id.toString();
            } else {
                leaveOrphaned++;
                problematicLeaves.push({
                    id: leave._id.toString(),
                    doctorField: docIdRef,
                    date: leave.date,
                    reason: 'Orphaned: doctor field does not match any Doctor.user nor Doctor._id',
                });
            }

            // Check potential duplicate index conflicts: { doctor: 1, date: 1 } (unique)
            if (targetDoctorId !== null) {
                const key = `${targetDoctorId}_${leave.date}`;
                if (leaveKeyMap.has(key)) {
                    leaveKeyMap.get(key).push(leave);
                } else {
                    leaveKeyMap.set(key, [leave]);
                }
            }
        }

        for (const [key, records] of leaveKeyMap.entries()) {
            if (records.length > 1) {
                leaveDuplicateConflicts.push({
                    targetKey: key,
                    count: records.length,
                    recordIds: records.map((r) => r._id.toString()),
                    date: records[0].date,
                });
            }
        }

        // ----------------------------------------------------
        // 5. AUDIT APPOINTMENTS
        // ----------------------------------------------------
        let aptCanonicalDoctor = 0;
        let aptLegacyUser = 0;
        let aptOrphaned = 0;
        let aptAmbiguousCollisions = 0;
        const problematicAppointments = [];

        for (const apt of appointments) {
            const docIdRef = apt.doctor ? apt.doctor.toString() : null;

            if (!docIdRef) {
                aptOrphaned++;
                problematicAppointments.push({
                    id: apt._id.toString(),
                    doctorField: null,
                    date: apt.date,
                    time: apt.time,
                    reason: 'Appointment doctor field is null/undefined',
                });
                continue;
            }

            const isDoctorId = doctorMap.has(docIdRef);
            const matchingDoctorsForUser = doctorsByUserId.get(docIdRef) || [];
            const isUserIdMappingToDoctor = matchingDoctorsForUser.length > 0;

            if (isDoctorId && !isUserIdMappingToDoctor) {
                // Canonical Doctor._id reference
                aptCanonicalDoctor++;
            } else if (!isDoctorId && isUserIdMappingToDoctor) {
                // Legacy User._id reference that maps to a Doctor profile
                aptLegacyUser++;
                problematicAppointments.push({
                    id: apt._id.toString(),
                    doctorField: docIdRef,
                    mappedDoctorId: matchingDoctorsForUser[0]._id.toString(),
                    date: apt.date,
                    time: apt.time,
                    status: apt.status,
                    reason: 'Legacy User._id reference (needs backfill to Doctor._id)',
                });
            } else if (isDoctorId && isUserIdMappingToDoctor) {
                // Ambiguous identity collision
                aptAmbiguousCollisions++;
                problematicAppointments.push({
                    id: apt._id.toString(),
                    doctorField: docIdRef,
                    reason: 'Ambiguous collision: ID matches both a Doctor._id AND another Doctor\'s User._id',
                });
            } else {
                // Neither exists
                aptOrphaned++;
                problematicAppointments.push({
                    id: apt._id.toString(),
                    doctorField: docIdRef,
                    date: apt.date,
                    time: apt.time,
                    reason: 'Orphaned: ID does not match any Doctor._id nor any Doctor\'s User._id',
                });
            }
        }

        // ----------------------------------------------------
        // 6. READINESS EVALUATION
        // ----------------------------------------------------
        const isAvailReady = availOrphaned === 0 && availAmbiguous === 0 && availDuplicateConflicts.length === 0;
        const isLeaveReady = leaveOrphaned === 0 && leaveAmbiguous === 0 && leaveDuplicateConflicts.length === 0;
        const isAptReady = aptOrphaned === 0 && aptAmbiguousCollisions === 0;

        // ----------------------------------------------------
        // 7. CONSOLE REPORT
        // ----------------------------------------------------
        console.log('==================================================');
        console.log('MEDICONNECT DOCTOR IDENTITY AUDIT');
        console.log('==================================================\n');

        console.log('DOCTORS');
        console.log('-------');
        console.log(`Total Doctor profiles: ${doctors.length}`);
        console.log(`Doctor profiles with valid User references: ${doctorsWithValidUser}`);
        console.log(`Doctor profiles with missing User references: ${doctorsWithMissingUser}`);
        if (problematicDoctors.length > 0) {
            console.log('Sample missing User references:');
            problematicDoctors.slice(0, 5).forEach((d) => console.log(`  - Doctor ${d.doctorId}: ${d.reason}`));
        }
        console.log('');

        console.log('DOCTOR AVAILABILITY');
        console.log('-------------------');
        console.log(`Total records: ${availabilities.length}`);
        console.log(`Mapped to Doctor._id (via User._id): ${availMapped}`);
        if (availAlreadyDoctorId > 0) {
            console.log(`Already referencing Doctor._id directly: ${availAlreadyDoctorId}`);
        }
        console.log(`Orphaned User._id references: ${availOrphaned}`);
        console.log(`Ambiguous mappings: ${availAmbiguous}`);
        console.log(`Potential duplicate conflicts after migration: ${availDuplicateConflicts.length}`);
        if (availDuplicateConflicts.length > 0) {
            console.log('Duplicate conflict sample:');
            availDuplicateConflicts.slice(0, 5).forEach((c) => {
                console.log(`  - Key ${c.targetKey}: ${c.count} records [${c.recordIds.join(', ')}] (isActive: [${c.activeStates.join(', ')}])`);
            });
        }
        console.log('');

        console.log('DOCTOR LEAVE');
        console.log('------------');
        console.log(`Total records: ${leaves.length}`);
        console.log(`Mapped to Doctor._id (via User._id): ${leaveMapped}`);
        if (leaveAlreadyDoctorId > 0) {
            console.log(`Already referencing Doctor._id directly: ${leaveAlreadyDoctorId}`);
        }
        console.log(`Orphaned User._id references: ${leaveOrphaned}`);
        console.log(`Ambiguous mappings: ${leaveAmbiguous}`);
        console.log(`Potential duplicate conflicts after migration: ${leaveDuplicateConflicts.length}`);
        if (leaveDuplicateConflicts.length > 0) {
            console.log('Duplicate conflict sample:');
            leaveDuplicateConflicts.slice(0, 5).forEach((c) => {
                console.log(`  - Date ${c.date} for target key ${c.targetKey}: ${c.count} records [${c.recordIds.join(', ')}]`);
            });
        }
        console.log('');

        console.log('APPOINTMENTS');
        console.log('------------');
        console.log(`Total records: ${appointments.length}`);
        console.log(`Canonical Doctor._id references: ${aptCanonicalDoctor}`);
        console.log(`Legacy User._id references: ${aptLegacyUser}`);
        console.log(`Orphaned references: ${aptOrphaned}`);
        console.log(`Ambiguous identity collisions: ${aptAmbiguousCollisions}`);
        console.log('');

        console.log('MIGRATION READINESS');
        console.log('-------------------');
        console.log(`Availability migration: ${isAvailReady ? 'READY' : 'NOT READY'}`);
        console.log(`Leave migration: ${isLeaveReady ? 'READY' : 'NOT READY'}`);
        console.log(`Appointment migration: ${isAptReady ? 'READY' : 'NOT READY'}`);
        console.log('');

        console.log('RECORDS REQUIRING MANUAL REVIEW');
        console.log('--------------------------------');
        const allIssues = [
            ...problematicDoctors.map((d) => `[Doctor] ID: ${d.doctorId} -> ${d.reason}`),
            ...problematicAvailabilities.map((a) => `[Availability] ID: ${a.id} (doctor: ${a.doctorField}) -> ${a.reason}`),
            ...problematicLeaves.map((l) => `[Leave] ID: ${l.id} (doctor: ${l.doctorField}) -> ${l.reason}`),
            ...problematicAppointments.map((p) => `[Appointment] ID: ${p.id} (doctor: ${p.doctorField}, date: ${p.date}, time: ${p.time}) -> ${p.reason}`),
        ];

        if (allIssues.length === 0 && availDuplicateConflicts.length === 0 && leaveDuplicateConflicts.length === 0) {
            console.log('None! All existing records cleanly map to unique Doctor identities.');
        } else {
            console.log(`Total issues identified: ${allIssues.length + availDuplicateConflicts.length + leaveDuplicateConflicts.length}`);
            allIssues.slice(0, 15).forEach((issue) => console.log(`  - ${issue}`));
            if (allIssues.length > 15) {
                console.log(`  ... and ${allIssues.length - 15} more records.`);
            }
        }
        console.log('');

        console.log('IMPORTANT FINDINGS');
        console.log('------------------');
        if (doctors.length === 0) {
            console.log('- Database currently contains 0 Doctor records.');
        } else {
            console.log(`- Audited ${doctors.length} Doctor profiles and ${users.length} Users.`);
        }
        if (availAlreadyDoctorId > 0) {
            console.log(`- ${availAlreadyDoctorId} DoctorAvailability documents already use Doctor._id.`);
        }
        if (leaveAlreadyDoctorId > 0) {
            console.log(`- ${leaveAlreadyDoctorId} DoctorLeave documents already use Doctor._id.`);
        }
        if (aptLegacyUser > 0) {
            console.log(`- ${aptLegacyUser} Appointment documents use legacy User._id and must be backfilled to Doctor._id.`);
        } else if (appointments.length > 0) {
            console.log(`- All ${appointments.length} appointments already use canonical Doctor._id.`);
        }
        if (availDuplicateConflicts.length > 0) {
            console.log(`- Found ${availDuplicateConflicts.length} potential duplicate availability conflict(s) that would collide under { doctor: 1, dayOfWeek: 1 }.`);
        }
        if (leaveDuplicateConflicts.length > 0) {
            console.log(`- Found ${leaveDuplicateConflicts.length} duplicate leave conflict(s) that would violate the unique index { doctor: 1, date: 1 }.`);
        }

    } catch (err) {
        console.error('Error during audit execution:', err);
    } finally {
        await mongoose.disconnect();
        console.log('\nDatabase connection closed. Read-only audit complete.');
    }
}

runAudit();
