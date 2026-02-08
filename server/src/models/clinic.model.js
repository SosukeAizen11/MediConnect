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
    isApproved: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Clinic = mongoose.model('Clinic', clinicSchema);

export default Clinic;
