import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
    {
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

        originType: {
            type: String,
            enum: ['APPOINTMENT', 'TOKEN'],
            required: true,
        },

        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
        },

        token: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Token',
        },

        diagnosis: {
            type: String,
            required: true,
            trim: true,
        },

        prescription: {
            type: String,
            default: '',
            trim: true,
        },

        consultationNotes: {
            type: String,
            default: '',
            trim: true,
        },

        prescriptionUrl: {
            type: String,
            default: '',
            trim: true,
        },

        consultationDate: {
            type: String,
            required: true,
        },

        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Patient's clinical history
consultationSchema.index({
    patient: 1,
    completedAt: -1,
});

// Patient's history with a particular doctor
consultationSchema.index({
    patient: 1,
    doctor: 1,
    completedAt: -1,
});

// Clinic-level history
consultationSchema.index({
    clinic: 1,
    completedAt: -1,
});

// One consultation per appointment
consultationSchema.index(
    { appointment: 1 },
    { unique: true, sparse: true }
);

// One consultation per token
consultationSchema.index(
    { token: 1 },
    { unique: true, sparse: true }
);

const Consultation = mongoose.model(
    'Consultation',
    consultationSchema
);

export default Consultation;
