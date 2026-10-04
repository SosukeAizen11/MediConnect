import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
            index: true,
        },

        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            required: true,
            default: 'INR',
            uppercase: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                'PENDING',
                'PROCESSING',
                'SUCCEEDED',
                'FAILED',
                'REFUNDED',
            ],
            default: 'PENDING',
            index: true,
        },

        provider: {
            type: String,
            enum: ['RAZORPAY', 'STRIPE', 'MANUAL'],
            default: 'MANUAL',
        },

        providerPaymentId: {
            type: String,
            default: null,
            sparse: true,
        },

        providerOrderId: {
            type: String,
            default: null,
            sparse: true,
        },

        idempotencyKey: {
            type: String,
            required: true,
            trim: true,
        },

        failureReason: {
            type: String,
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },

        refundedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index(
    { patient: 1, idempotencyKey: 1 },
    { unique: true }
);

paymentSchema.index({ invoice: 1, createdAt: -1 });
paymentSchema.index({ patient: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;