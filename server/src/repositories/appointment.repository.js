import Appointment from '../models/appointment.model.js';

export const findActiveByDoctorAndDateTime = async (
    doctorId,
    date,
    time
) => {
    return Appointment.findOne({
        doctor: doctorId,
        date,
        time,
        status: { $ne: 'CANCELLED' },
    });
};

export const findBookedByDoctorAndDate = async (doctorId, date) => {
    return Appointment.find({
        doctor: doctorId,
        date,
        status: { $ne: 'CANCELLED' },
    }).select('time');
};

export const create = async (appointmentData) => {
    return Appointment.create(appointmentData);
};

export const countByDoctorAndDate = async (doctorId, date) => {
    return Appointment.countDocuments({ doctor: doctorId, date });
};

export const countByDoctorAndStatuses = async (doctorId, statuses) => {
    return Appointment.countDocuments({
        doctor: doctorId,
        status: { $in: statuses },
    });
};

/**
 * Returns completed appointments for a doctor with patient name and phone populated.
 * Only selects fields needed by getMyPatients — not the full document.
 */
export const findCompletedByDoctor = async (doctorId) => {
    return Appointment.find({
        doctor: doctorId,
        status: 'COMPLETED',
    })
        .populate('patient', 'name phone')
        .sort({ date: -1, time: -1 })
        .select('patient date');
};

export const countByPatient = async (patientId) => {
    return Appointment.countDocuments({ patient: patientId });
};

/**
 * Counts upcoming/active appointments for a patient on or after a given date.
 */
export const countUpcomingByPatient = async (patientId, fromDate) => {
    return Appointment.countDocuments({
        patient: patientId,
        status: { $in: ['BOOKED', 'CONFIRMED'] },
        date: { $gte: fromDate },
    });
};

/**
 * Returns up to `limit` upcoming appointments for a patient, with doctor (→ user.name)
 * and clinic (→ name) populated — exactly matching the patient dashboard list shape.
 */
export const findUpcomingByPatient = async (patientId, fromDate, limit = 5) => {
    return Appointment.find({
        patient: patientId,
        status: { $in: ['BOOKED', 'CONFIRMED'] },
        date: { $gte: fromDate },
    })
        .populate({
            path: 'doctor',
            populate: {
                path: 'user',
                select: 'name',
            },
        })
        .populate('clinic', 'name')
        .sort({ date: 1, time: 1 })
        .limit(limit);
};

/**
 * Returns all appointments for a patient with doctor (→ user: name, email)
 * and clinic (→ name, address) populated, sorted newest first.
 *
 * @param {string} patientId - User._id
 * @returns {Promise<Array>}
 */
export const findByPatientWithDetails = async (patientId) => {
    return Appointment.find({ patient: patientId })
        .populate({
            path: 'doctor',
            populate: { path: 'user', select: 'name email' },
        })
        .populate('clinic', 'name address')
        .sort({ createdAt: -1 });
};

/**
 * Returns all appointments for a doctor with patient (name, email, phone)
 * and clinic (name, address) populated, sorted chronologically by date and time.
 *
 * @param {string} doctorProfileId - Canonical Doctor._id
 * @returns {Promise<Array>}
 */
export const findByDoctorWithDetails = async (doctorProfileId) => {
    return Appointment.find({ doctor: doctorProfileId })
        .populate('patient', 'name email phone')
        .populate('clinic', 'name address')
        .sort({ date: 1, time: 1 });
};

export const findById = async (id) => {
    return Appointment.findById(id);
};

export const save = async (appointment) => {
    return appointment.save();
};