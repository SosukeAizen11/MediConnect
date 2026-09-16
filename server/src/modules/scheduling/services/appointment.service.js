import * as doctorRepository from '../../../repositories/doctor.repository.js';
import * as doctorLeaveRepository from '../repositories/doctorLeave.repository.js';
import * as doctorAvailabilityRepository from '../repositories/doctorAvailability.repository.js';
import * as appointmentRepository from '../repositories/appointment.repository.js';
import { generateSlots } from '../../../utils/slotGenerator.js';
import {
    getConsultationByAppointmentId,
    getPatientConsultationHistory,
    getPrescriptionUrlsForAppointments,
} from '../../clinical/index.js';

export const bookAppointment = async ({
    patientId,
    doctorId,
    date,
    time,
}) => {
    // 1. Resolve doctor profile using canonical Doctor._id
    const doctorProfile = await doctorRepository.findById(doctorId);

    if (!doctorProfile) {
        throw new Error('Doctor profile not found');
    }

    // 2. Check doctor leave using Doctor._id
    const leave = await doctorLeaveRepository.findByDoctorAndDate(
        doctorProfile._id,
        date
    );

    if (leave) {
        throw new Error('Doctor is on leave on this date');
    }

    // 3. Determine day of week
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 4. Find availability using Doctor._id
    const availability = await doctorAvailabilityRepository.findActiveByDoctorAndDay(
        doctorProfile._id,
        dayOfWeek
    );

    if (!availability) {
        throw new Error('Doctor is not available on this day');
    }

    // 5. Generate valid slots
    const validSlots = generateSlots(
        availability.startTime,
        availability.endTime,
        availability.slotDuration
    );

    if (!validSlots.includes(time)) {
        throw new Error('Invalid time slot');
    }

    // 6. Check whether slot is already booked using Doctor._id
    const existingAppointment = await appointmentRepository.findActiveByDoctorAndDateTime(
        doctorProfile._id,
        date,
        time
    );

    if (existingAppointment) {
        throw new Error('Slot already booked');
    }

    // 7. Validate clinic association
    if (!doctorProfile.clinic) {
        throw new Error('Doctor is not associated with any clinic');
    }

    // 8. Create appointment
    const appointment = await appointmentRepository.create({
        patient: patientId,
        doctor: doctorProfile._id,
        clinic: doctorProfile.clinic,
        date,
        time,
        status: 'CONFIRMED',
    });

    return appointment;
};

/**
 * Returns available slots for a given doctor on a given date.
 *
 * @param {string} doctorId - Canonical Doctor._id
 * @param {string} date     - ISO date string "YYYY-MM-DD"
 * @returns {{ slots: Array<{ time: string, available: boolean }>, onLeave: boolean }}
 */
export const getAvailableSlots = async (doctorId, date) => {
    // 1. Resolve doctor profile using canonical Doctor._id
    const doctorProfile = await doctorRepository.findById(doctorId);
    if (!doctorProfile) {
        throw new Error('Doctor not found');
    }

    // 2. Parse the date safely using local components to avoid UTC timezone shift
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 3. Check if doctor is on leave
    const leave = await doctorLeaveRepository.findByDoctorAndDate(
        doctorProfile._id,
        date
    );

    if (leave) {
        return { slots: [], onLeave: true };
    }

    // 4. Fetch active availability for this day
    const availability = await doctorAvailabilityRepository.findActiveByDoctorAndDay(
        doctorProfile._id,
        dayOfWeek
    );

    if (!availability) {
        return { slots: [], onLeave: false };
    }

    // 5. Generate all possible slots
    const allSlots = generateSlots(
        availability.startTime,
        availability.endTime,
        availability.slotDuration
    );

    // 6. Fetch booked appointments for this doctor on this date
    const bookedAppointments = await appointmentRepository.findBookedByDoctorAndDate(
        doctorProfile._id,
        date
    );

    const bookedTimes = bookedAppointments.map((a) => a.time);

    // 7. Return slots annotated with availability
    const slots = allSlots.map((time) => ({
        time,
        available: !bookedTimes.includes(time),
    }));

    return { slots, onLeave: false };
};

/**
 * Returns appointment count statistics for a doctor's dashboard.
 *
 * @param {string} doctorId  - Canonical Doctor._id
 * @param {string} dateString - Today's date as "YYYY-MM-DD"
 * @returns {{ todayCount: number, pendingCount: number }}
 */
export const getDoctorAppointmentStats = async (doctorId, dateString) => {
    const [todayCount, pendingCount] = await Promise.all([
        appointmentRepository.countByDoctorAndDate(doctorId, dateString),
        appointmentRepository.countByDoctorAndStatuses(doctorId, ['BOOKED', 'CONFIRMED']),
    ]);

    return { todayCount, pendingCount };
};

/**
 * Returns completed appointments for a doctor, with patient info populated.
 * Each entry: { patient: { _id, name, phone }, date }
 *
 * @param {string} doctorId - Canonical Doctor._id
 * @returns {Array<{ patient: object, date: string }>}
 */
export const getCompletedAppointmentsByDoctor = async (doctorId) => {
    return appointmentRepository.findCompletedByDoctor(doctorId);
};

/**
 * Returns all appointment data needed for a patient's dashboard in one call.
 *
 * Runs the three appointment queries in parallel to minimise latency.
 *
 * @param {string} patientId   - User._id of the patient
 * @param {string} todayString - Today's date as "YYYY-MM-DD"
 * @returns {{
 *   totalCount: number,
 *   upcomingCount: number,
 *   upcomingList: Array<{ doctorName: string, clinicName: string, date: string, time: string }>
 * }}
 */
export const getPatientDashboardData = async (patientId, todayString) => {
    const [totalCount, upcomingCount, rawUpcoming] = await Promise.all([
        appointmentRepository.countByPatient(patientId),
        appointmentRepository.countUpcomingByPatient(patientId, todayString),
        appointmentRepository.findUpcomingByPatient(patientId, todayString, 5),
    ]);

    const upcomingList = rawUpcoming.map((apt) => ({
        doctorName: apt.doctor?.user?.name || 'Unknown Doctor',
        clinicName: apt.clinic?.name || 'Unknown Clinic',
        date: apt.date,
        time: apt.time,
    }));

    return { totalCount, upcomingCount, upcomingList };
};

/**
 * Retrieves all appointments for a given patient with doctor and clinic details,
 * decorated with prescription URLs from the Clinical domain.
 *
 * @param {string} patientId - User._id of the patient
 * @returns {Promise<Array>}
 */
export const getPatientAppointments = async (patientId) => {
    const appointments = await appointmentRepository.findByPatientWithDetails(patientId);
    if (!appointments || appointments.length === 0) {
        return [];
    }

    const appointmentIds = appointments.map((appt) => appt._id);
    const prescriptionUrls = await getPrescriptionUrlsForAppointments(appointmentIds);

    return appointments.map((appt) => {
        const apptObj = appt.toObject ? appt.toObject() : { ...appt };
        const clinicalUrl = prescriptionUrls[appt._id.toString()];
        return {
            ...apptObj,
            prescriptionUrl: clinicalUrl || apptObj.prescriptionUrl || '',
        };
    });
};

/**
 * Retrieves all appointments for a given doctor profile with patient and clinic details.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array>}
 */
export const getDoctorAppointments = async (doctorProfileId) => {
    return appointmentRepository.findByDoctorWithDetails(doctorProfileId);
};

/**
 * Updates an appointment's status after verifying doctor ownership and validating the transition.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @param {string} params.status          - One of 'CONFIRMED', 'COMPLETED', 'CANCELLED'
 * @returns {Promise<object>} Updated appointment document
 */
export const updateAppointmentStatus = async ({
    appointmentId,
    doctorProfileId,
    status,
}) => {
    if (!status || !['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
        const error = new Error('Status must be CONFIRMED, COMPLETED, or CANCELLED');
        error.statusCode = 400;
        throw error;
    }

    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    appointment.status = status;
    return appointmentRepository.save(appointment);
};

/**
 * Verifies that an appointment exists, belongs to the doctor, and is in an active state
 * eligible for consultation (BOOKED or CONFIRMED). Does NOT mutate status.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<object>} Appointment document
 */
export const getAppointmentForConsultation = async ({ appointmentId, doctorProfileId }) => {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
        const error = new Error('Can only complete a BOOKED or CONFIRMED appointment');
        error.statusCode = 400;
        throw error;
    }

    return appointment;
};


/**
 * Completes an appointment slot after verifying doctor ownership and valid status.
 * Scheduling owns the lifecycle state transition to COMPLETED.
 *
 * @param {string|object} appointmentIdOrParams - Appointment._id or options object
 * @param {string} [doctorProfileIdParam]      - Canonical Doctor._id
 * @returns {Promise<object>} Updated appointment document populated for response
 */
export const completeAppointment = async (appointmentIdOrParams, doctorProfileIdParam) => {
    let appointmentId;
    let doctorProfileId;

    if (typeof appointmentIdOrParams === 'object' && appointmentIdOrParams !== null && appointmentIdOrParams.appointmentId) {
        appointmentId = appointmentIdOrParams.appointmentId;
        doctorProfileId = appointmentIdOrParams.doctorProfileId;
    } else {
        appointmentId = appointmentIdOrParams;
        doctorProfileId = doctorProfileIdParam;
    }

    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to update this appointment');
        error.statusCode = 403;
        throw error;
    }

    if (!['BOOKED', 'CONFIRMED'].includes(appointment.status)) {
        const error = new Error('Can only complete a BOOKED or CONFIRMED appointment');
        error.statusCode = 400;
        throw error;
    }

    appointment.status = 'COMPLETED';
    await appointmentRepository.save(appointment);

    return appointmentRepository.findPopulatedConsultationById(appointmentId);
};

/**
 * Retrieves appointment details with patient, clinic, doctor, and patient's past consultations with this doctor.
 * Scheduling owns appointment metadata/lifecycle; Clinical owns clinical consultation details.
 *
 * @param {object} params
 * @param {string} params.appointmentId  - Appointment._id
 * @param {string} params.doctorProfileId - Canonical Doctor._id
 * @returns {Promise<object>} { appointment, pastAppointments }
 */
export const getAppointmentDetails = async ({ appointmentId, doctorProfileId }) => {
    const appointment = await appointmentRepository.findDetailsById(appointmentId);

    if (!appointment) {
        const error = new Error('Appointment not found');
        error.statusCode = 404;
        throw error;
    }

    if (appointment.doctor._id.toString() !== doctorProfileId.toString()) {
        const error = new Error('Not authorized to view this appointment');
        error.statusCode = 403;
        throw error;
    }

    // Fetch clinical data via Clinical facade
    const [consultation, consultationHistory] = await Promise.all([
        getConsultationByAppointmentId(appointmentId),
        getPatientConsultationHistory({
            patientId: appointment.patient._id,
            doctorProfileId,
            limit: 10,
        }),
    ]);

    // Compose appointment object with canonical clinical fields
    const appointmentObj = appointment.toObject ? appointment.toObject() : { ...appointment };
    if (consultation) {
        appointmentObj.diagnosis = consultation.diagnosis || appointmentObj.diagnosis || '';
        appointmentObj.prescription = consultation.prescription || appointmentObj.prescription || '';
        appointmentObj.consultationNotes = consultation.consultationNotes || appointmentObj.consultationNotes || '';
        appointmentObj.prescriptionUrl = consultation.prescriptionUrl || appointmentObj.prescriptionUrl || '';
    }

    // Compose pastAppointments from clinical consultation history (excluding current encounter)
    const pastAppointments = (consultationHistory || [])
        .filter((c) => {
            const isCurrentAppointment = c.appointment && (
                (c.appointment._id && c.appointment._id.toString() === appointmentId.toString()) ||
                c.appointment.toString() === appointmentId.toString()
            );
            const isCurrentConsultation = consultation && c._id.toString() === consultation._id.toString();
            return !isCurrentAppointment && !isCurrentConsultation;
        })
        .map((c) => ({
            _id: c._id,
            date: c.consultationDate || (c.appointment && c.appointment.date) || (c.completedAt ? new Date(c.completedAt).toISOString().split('T')[0] : ''),
            time: (c.appointment && c.appointment.time) || (c.completedAt ? new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            status: 'COMPLETED',
            diagnosis: c.diagnosis || '',
            prescription: c.prescription || '',
            consultationNotes: c.consultationNotes || '',
            prescriptionUrl: c.prescriptionUrl || '',
            clinic: c.clinic || null,
            doctor: c.doctor || null,
            originType: c.originType,
        }));

    return {
        appointment: appointmentObj,
        pastAppointments,
    };
};

/**
 * Returns appointment counts needed for admin platform analytics.
 *
 * @returns {Promise<object>} { totalAppointments, completedAppointments, pendingAppointments }
 */
export const getAppointmentStatsForAdmin = async () => {
    const [totalAppointments, completedAppointments, pendingAppointments] = await Promise.all([
        appointmentRepository.countAll(),
        appointmentRepository.countByStatuses(['COMPLETED']),
        appointmentRepository.countByStatuses(['BOOKED', 'PENDING']),
    ]);

    return {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
    };
};