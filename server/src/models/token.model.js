import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
    },
    tokenNumber: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        },
    },
    status: {
        type: String,
        enum: ['WAITING', 'CALLED', 'COMPLETED', 'CANCELLED'],
        default: 'WAITING',
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for unique token per clinic per day
tokenSchema.index({ clinic: 1, date: 1, tokenNumber: 1 }, { unique: true });

const Token = mongoose.model('Token', tokenSchema);
export default Token;
