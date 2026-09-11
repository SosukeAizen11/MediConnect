import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
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

import * as doctorAvailabilityController from '../controllers/doctorAvailability.controller.js';
import * as leaveController from '../controllers/leave.controller.js';
import * as slotController from '../controllers/slot.controller.js';
import * as appointmentController from '../controllers/appointment.controller.js';
import { bookAppointment } from '../services/appointment.service.js';

// Mock Express req, res
function createMockReqRes(user, body = {}, params = {}, query = {}) {
    let statusCode = 200;
    let responseData = null;

    const req = {
        user,
        body,
        params,
        query,
    };

    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(data) {
            responseData = data;
            return this;
        },
    };

    const getResult = () => ({ status: statusCode, data: responseData });

    return { req, res, getResult };
}

async function runVerification() {
    console.log('Connecting to MongoDB for migration verification...');
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected.\n');

    try {
        console.log('==================================================');
        console.log('STARTING INTEGRATION VERIFICATION TESTS');
        console.log('==================================================\n');

        const doctors = await Doctor.find().populate('user').lean();
        const patients = await User.find({ role: 'PATIENT' }).lean();

        if (doctors.length < 2 || patients.length < 1) {
            throw new Error('Not enough test data in database.');
        }

        const doc1 = doctors[0];
        const doc2 = doctors[1];
        const patient = patients[0];

        console.log(`Doctor 1: ${doc1.user.name || doc1.user.email} (Doctor ID: ${doc1._id}, User ID: ${doc1.user._id})`);
        console.log(`Doctor 2: ${doc2.user.name || doc2.user.email} (Doctor ID: ${doc2._id}, User ID: ${doc2.user._id})`);
        console.log(`Patient:  ${patient.name || patient.email} (User ID: ${patient._id})\n`);

        // ----------------------------------------------------
        // TEST 1: Doctor Availability CRUD
        // ----------------------------------------------------
        console.log('Test 1: Doctor Availability CRUD (using Doctor 1)');
        // Ensure no active test record for dayOfWeek 4 for Doc 1
        await DoctorAvailability.deleteMany({ doctor: doc1._id, dayOfWeek: 4 });

        // 1a: Create Availability
        const { req: createAvailReq, res: createAvailRes, getResult: getCreateAvailRes } =
            createMockReqRes(doc1.user, {
                dayOfWeek: 4,
                startTime: '09:00',
                endTime: '12:00',
                slotDuration: 30,
            });
        await doctorAvailabilityController.createAvailability(createAvailReq, createAvailRes);
        const createAvailResult = getCreateAvailRes();
        if (createAvailResult.status !== 201 || !createAvailResult.data.success) {
            throw new Error(`Create availability failed: ${JSON.stringify(createAvailResult)}`);
        }
        const createdAvailId = createAvailResult.data.data._id;
        const createdAvailDoctorId = createAvailResult.data.data.doctor.toString();
        if (createdAvailDoctorId !== doc1._id.toString()) {
            throw new Error(`Availability was saved with doctor ID ${createdAvailDoctorId}, expected Doctor._id ${doc1._id}`);
        }
        console.log('  [PASS] 1a: Created availability storing canonical Doctor._id');

        // 1b: Get My Availability
        const { req: getAvailReq, res: getAvailRes, getResult: getGetAvailRes } =
            createMockReqRes(doc1.user);
        await doctorAvailabilityController.getMyAvailability(getAvailReq, getAvailRes);
        const getAvailResult = getGetAvailRes();
        const foundAvail = getAvailResult.data.data.find((a) => a._id.toString() === createdAvailId.toString());
        if (!foundAvail || foundAvail.doctor.toString() !== doc1._id.toString()) {
            throw new Error(`getMyAvailability did not return created record with Doctor._id.`);
        }
        console.log('  [PASS] 1b: getMyAvailability retrieved records using Doctor._id');

        // 1c: Update Availability
        const { req: updateAvailReq, res: updateAvailRes, getResult: getUpdateAvailRes } =
            createMockReqRes(doc1.user, { slotDuration: 20 }, { id: createdAvailId });
        await doctorAvailabilityController.updateAvailability(updateAvailReq, updateAvailRes);
        const updateAvailResult = getUpdateAvailRes();
        if (updateAvailResult.status !== 200 || updateAvailResult.data.data.slotDuration !== 20) {
            throw new Error(`updateAvailability failed: ${JSON.stringify(updateAvailResult)}`);
        }
        console.log('  [PASS] 1c: updateAvailability updated record scoped by Doctor._id');

        // 1d: Delete Availability
        const { req: delAvailReq, res: delAvailRes, getResult: getDelAvailRes } =
            createMockReqRes(doc1.user, {}, { id: createdAvailId });
        await doctorAvailabilityController.deleteAvailability(delAvailReq, delAvailRes);
        const delAvailResult = getDelAvailRes();
        if (delAvailResult.status !== 200) {
            throw new Error(`deleteAvailability failed: ${JSON.stringify(delAvailResult)}`);
        }
        // Cleanup test record
        await DoctorAvailability.deleteOne({ _id: createdAvailId });
        console.log('  [PASS] 1d: deleteAvailability soft-deleted record scoped by Doctor._id');

        // ----------------------------------------------------
        // TEST 2: Doctor Leave CRUD
        // ----------------------------------------------------
        console.log('\nTest 2: Doctor Leave CRUD (using Doctor 1)');
        const testLeaveDate = '2026-12-25';
        await DoctorLeave.deleteMany({ doctor: doc1._id, date: testLeaveDate });

        // 2a: Create Leave
        const { req: createLeaveReq, res: createLeaveRes, getResult: getCreateLeaveRes } =
            createMockReqRes(doc1.user, { date: testLeaveDate, reason: 'Christmas Holiday' });
        await leaveController.createLeave(createLeaveReq, createLeaveRes);
        const createLeaveResult = getCreateLeaveRes();
        if (createLeaveResult.status !== 201 || !createLeaveResult.data.success) {
            throw new Error(`createLeave failed: ${JSON.stringify(createLeaveResult)}`);
        }
        const createdLeaveId = createLeaveResult.data.data._id;
        const createdLeaveDocId = createLeaveResult.data.data.doctor.toString();
        if (createdLeaveDocId !== doc1._id.toString()) {
            throw new Error(`Leave was saved with doctor ID ${createdLeaveDocId}, expected Doctor._id ${doc1._id}`);
        }
        console.log('  [PASS] 2a: Created leave storing canonical Doctor._id');

        // 2b: Get My Leaves
        const { req: getLeaveReq, res: getLeaveRes, getResult: getGetLeaveRes } =
            createMockReqRes(doc1.user);
        await leaveController.getMyLeaves(getLeaveReq, getLeaveRes);
        const getLeaveResult = getGetLeaveRes();
        const foundLeave = getLeaveResult.data.data.find((l) => l._id.toString() === createdLeaveId.toString());
        if (!foundLeave || foundLeave.doctor.toString() !== doc1._id.toString()) {
            throw new Error('getMyLeaves did not return created record with Doctor._id');
        }
        console.log('  [PASS] 2b: getMyLeaves retrieved leaves using Doctor._id');

        // 2c: Delete Leave
        const { req: delLeaveReq, res: delLeaveRes, getResult: getDelLeaveRes } =
            createMockReqRes(doc1.user, {}, { id: createdLeaveId });
        await leaveController.deleteLeave(delLeaveReq, delLeaveRes);
        const delLeaveResult = getDelLeaveRes();
        if (delLeaveResult.status !== 200) {
            throw new Error(`deleteLeave failed: ${JSON.stringify(delLeaveResult)}`);
        }
        console.log('  [PASS] 2c: deleteLeave deleted leave scoped by Doctor._id');

        // ----------------------------------------------------
        // TEST 3: Patient Slot Retrieval
        // ----------------------------------------------------
        console.log('\nTest 3: Patient Slot Retrieval (using Doctor 2)');
        // Doctor 2 has migrated availability for days 0-6. Let's find a valid date.
        // Today is 2026-09-11 (Friday, day 5).
        const targetDate = '2026-09-15'; // Tuesday, day 2
        const { req: slotReq, res: slotRes, getResult: getSlotRes } =
            createMockReqRes(patient, {}, {}, { doctorId: doc2._id.toString(), date: targetDate });
        await slotController.getAvailableSlots(slotReq, slotRes);
        const slotResult = getSlotRes();
        if (slotResult.status !== 200 || !slotResult.data.success || !Array.isArray(slotResult.data.slots)) {
            throw new Error(`getAvailableSlots failed: ${JSON.stringify(slotResult)}`);
        }
        if (slotResult.data.slots.length === 0) {
            throw new Error('Expected slots for Doctor 2, but 0 returned.');
        }
        console.log(`  [PASS] 3: Retrieved ${slotResult.data.slots.length} available slots for Doctor 2 (${doc2._id}) on ${targetDate}`);

        // ----------------------------------------------------
        // TEST 4: Patient Appointment Booking
        // ----------------------------------------------------
        console.log('\nTest 4: Patient Appointment Booking (Service)');
        const testTime = slotResult.data.slots[0].time;
        // Clean up any existing conflicting appointment on that slot
        await Appointment.deleteMany({ doctor: doc2._id, date: targetDate, time: testTime });

        const bookedAppointment = await bookAppointment({
            patientId: patient._id,
            doctorId: doc2._id.toString(),
            date: targetDate,
            time: testTime,
        });

        if (!bookedAppointment || bookedAppointment.doctor.toString() !== doc2._id.toString()) {
            throw new Error(`Appointment was not booked with Doctor._id ${doc2._id}`);
        }
        console.log(`  [PASS] 4: Booked appointment successfully: ID ${bookedAppointment._id}, doctor=${bookedAppointment.doctor}`);

        // ----------------------------------------------------
        // TEST 5: Verify Slot is Now Marked Unavailable
        // ----------------------------------------------------
        console.log('\nTest 5: Verify Slot is Now Unavailable');
        const { req: slotReq2, res: slotRes2, getResult: getSlotRes2 } =
            createMockReqRes(patient, {}, {}, { doctorId: doc2._id.toString(), date: targetDate });
        await slotController.getAvailableSlots(slotReq2, slotRes2);
        const slotResult2 = getSlotRes2();
        const bookedSlotEntry = slotResult2.data.slots.find((s) => s.time === testTime);
        if (!bookedSlotEntry || bookedSlotEntry.available !== false) {
            throw new Error(`Booked slot ${testTime} was expected to be available: false, but got: ${JSON.stringify(bookedSlotEntry)}`);
        }
        console.log(`  [PASS] 5: Slot ${testTime} correctly reflected as available: false`);

        // ----------------------------------------------------
        // TEST 6: Doctor Appointment Retrieval
        // ----------------------------------------------------
        console.log('\nTest 6: Doctor Appointment Retrieval');
        const { req: docAptReq, res: docAptRes, getResult: getDocAptRes } =
            createMockReqRes(doc2.user);
        await appointmentController.getDoctorAppointments(docAptReq, docAptRes, (err) => {
            if (err) throw err;
        });
        const docAptResult = getDocAptRes();
        const foundApt = docAptResult.data.appointments.find((a) => a._id.toString() === bookedAppointment._id.toString());
        if (!foundApt) {
            throw new Error('Doctor 2 failed to retrieve the newly booked appointment.');
        }
        console.log(`  [PASS] 6: Doctor 2 retrieved ${docAptResult.data.appointments.length} appointments, including the new booking`);

        // ----------------------------------------------------
        // TEST 7: Appointment Status Authorization
        // ----------------------------------------------------
        console.log('\nTest 7: Appointment Status Authorization');
        // 7a: Doctor 1 (wrong doctor) attempts to update Doctor 2's appointment status
        let forbiddenTriggered = false;
        const { req: wrongDocReq, res: wrongDocRes } =
            createMockReqRes(doc1.user, { status: 'CONFIRMED' }, { id: bookedAppointment._id });
        await appointmentController.updateAppointmentStatus(wrongDocReq, wrongDocRes, (err) => {
            if (err && err.message.includes('Not authorized')) {
                forbiddenTriggered = true;
            }
        });
        if (!forbiddenTriggered) {
            throw new Error('Expected 403 / Not authorized when Doctor 1 accesses Doctor 2 appointment, but succeeded!');
        }
        console.log('  [PASS] 7a: Unauthorized doctor update correctly blocked with 403 / Not authorized');

        // 7b: Doctor 2 (correct doctor) updates appointment status
        const { req: correctDocReq, res: correctDocRes, getResult: getCorrectDocRes } =
            createMockReqRes(doc2.user, { status: 'CONFIRMED' }, { id: bookedAppointment._id });
        await appointmentController.updateAppointmentStatus(correctDocReq, correctDocRes, (err) => {
            if (err) throw err;
        });
        const correctDocResult = getCorrectDocRes();
        if (correctDocResult.status !== 200 || correctDocResult.data.data.status !== 'CONFIRMED') {
            throw new Error(`Doctor 2 status update failed: ${JSON.stringify(correctDocResult)}`);
        }
        console.log('  [PASS] 7b: Authorized doctor status update succeeded (status: CONFIRMED)');

        // Cleanup test appointment
        await Appointment.deleteOne({ _id: bookedAppointment._id });
        console.log('  [INFO] Cleaned up temporary test appointment.');

        console.log('\n==================================================');
        console.log('ALL 7 INTEGRATION VERIFICATION TESTS PASSED!');
        console.log('==================================================\n');

    } catch (err) {
        console.error('Verification failed with error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed.');
    }
}

runVerification();
