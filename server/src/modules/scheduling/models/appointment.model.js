import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['BOOKED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'BOOKED',
    },
    diagnosis: {
        type: String,
        trim: true,
        default: '',
    },
    prescription: {
        type: String,
        trim: true,
        default: '',
    },
    consultationNotes: {
        type: String,
        trim: true,
        default: '',
    },
    prescriptionUrl: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
