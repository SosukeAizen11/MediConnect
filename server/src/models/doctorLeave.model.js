import mongoose from 'mongoose';

const doctorLeaveSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure one leave entry per doctor per date
doctorLeaveSchema.index({ doctor: 1, date: 1 }, { unique: true });

const DoctorLeave = mongoose.model('DoctorLeave', doctorLeaveSchema);

export default DoctorLeave;
