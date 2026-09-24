import mongoose from 'mongoose';

const clinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    clinicType: {
        type: String,
        enum: ['APPOINTMENT', 'TOKEN'],
        required: true,
    },
    workingHours: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Clinic = mongoose.model('Clinic', clinicSchema);

export default Clinic;
