import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        slotDuration: {
            type: Number,
            required: true,
            default: 15,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

doctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 });

const DoctorAvailability = mongoose.model(
    "DoctorAvailability",
    doctorAvailabilitySchema
);

export default DoctorAvailability;
