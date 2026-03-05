import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
    {
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        slots: [
            {
                time: {
                    type: String,
                    required: true,
                },
                available: {
                    type: Boolean,
                    default: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Slot = mongoose.model("Slot", slotSchema);
export default Slot;
