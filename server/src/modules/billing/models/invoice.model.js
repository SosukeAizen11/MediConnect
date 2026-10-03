import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

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

        consultation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Consultation',
            required: true,
            unique: true,
        },

        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },

        token: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Token',
            default: null,
        },

        // All monetary values are stored in paise.
        // Example: ₹500 = 50000 paise.
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
            integer: true,
        },

        bookingCredit: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            integer: true,
        },

        amountDue: {
            type: Number,
            required: true,
            min: 0,
            integer: true,
        },

        status: {
            type: String,
            enum: [
                'DRAFT',
                'ISSUED',
                'PARTIALLY_PAID',
                'PAID',
                'OVERDUE',
                'CANCELLED',
            ],
            default: 'ISSUED',
        },

        issuedAt: {
            type: Date,
            default: Date.now,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index({
    patient: 1,
    issuedAt: -1,
});

invoiceSchema.index({
    doctor: 1,
    issuedAt: -1,
});

invoiceSchema.index({
    clinic: 1,
    issuedAt: -1,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;