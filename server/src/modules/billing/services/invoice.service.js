import mongoose from 'mongoose';
import Invoice from '../models/invoice.model.js';

const generateInvoiceNumber = () => {
    const suffix = new mongoose.Types.ObjectId()
        .toString()
        .slice(-8)
        .toUpperCase();

    return `INV-${suffix}`;
};

/**
 * Creates the final invoice for a completed consultation.
 *
 * Billing owns the invoice.
 * Clinical provides the completed consultation context.
 *
 * Monetary values are accepted in paise.
 */
export const createConsultationInvoice = async ({
    patientId,
    doctorId,
    clinicId,
    consultationId,
    appointmentId = null,
    tokenId = null,
    totalAmount,
    bookingCredit = 0,
}) => {
    if (!patientId) {
        const error = new Error('patientId is required');
        error.statusCode = 400;
        throw error;
    }

    if (!doctorId) {
        const error = new Error('doctorId is required');
        error.statusCode = 400;
        throw error;
    }

    if (!clinicId) {
        const error = new Error('clinicId is required');
        error.statusCode = 400;
        throw error;
    }

    if (!consultationId) {
        const error = new Error('consultationId is required');
        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isInteger(totalAmount) ||
        totalAmount < 0
    ) {
        const error = new Error('totalAmount must be a non-negative integer in paise');
        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isInteger(bookingCredit) ||
        bookingCredit < 0
    ) {
        const error = new Error('bookingCredit must be a non-negative integer in paise');
        error.statusCode = 400;
        throw error;
    }

    if (bookingCredit > totalAmount) {
        const error = new Error('bookingCredit cannot exceed totalAmount');
        error.statusCode = 400;
        throw error;
    }

    const existingInvoice = await Invoice.findOne({
        consultation: consultationId,
    });

    if (existingInvoice) {
        return existingInvoice;
    }

    const amountDue = totalAmount - bookingCredit;

    return Invoice.create({
        invoiceNumber: generateInvoiceNumber(),

        patient: patientId,
        doctor: doctorId,
        clinic: clinicId,

        consultation: consultationId,
        appointment: appointmentId,
        token: tokenId,

        totalAmount,
        bookingCredit,
        amountDue,

        status: 'ISSUED',
    });
};

/**
 * Retrieves an invoice by its consultation.
 */
export const getInvoiceByConsultationId = async (consultationId) => {
    if (!consultationId) {
        return null;
    }

    return Invoice.findOne({
        consultation: consultationId,
    });
};

/**
 * Retrieves a patient's invoices.
 */
export const getPatientInvoices = async (patientId) => {
    if (!patientId) {
        const error = new Error('patientId is required');
        error.statusCode = 400;
        throw error;
    }

    return Invoice.find({
        patient: patientId,
    }).sort({
        issuedAt: -1,
    });
};

export const getInvoiceById = async (invoiceId) => {
    return Invoice.findById(invoiceId);
};

export const recordPaymentSuccess = async ({ invoiceId, paymentId, amount }) => {
    if (!invoiceId) {
        throw new Error('Invoice ID is required');
    }

    if (!paymentId) {
        throw new Error('Payment ID is required');
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('Payment amount must be a positive integer in paise');
    }

    const appliedPaymentId = new mongoose.Types.ObjectId(paymentId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const updatedInvoice = await Invoice.findOneAndUpdate(
            {
                _id: invoiceId,
                status: { $ne: 'CANCELLED' },
                amountDue: { $gte: amount },
                appliedPaymentIds: { $ne: appliedPaymentId },
            },
            [
                {
                    $set: {
                        amountDue: { $subtract: ['$amountDue', amount] },
                        appliedPaymentIds: {
                            $setUnion: [
                                { $ifNull: ['$appliedPaymentIds', []] },
                                [{ $literal: appliedPaymentId }],
                            ],
                        },
                        status: {
                            $cond: [
                                {
                                    $eq: [
                                        { $subtract: ['$amountDue', amount] },
                                        0,
                                    ],
                                },
                                'PAID',
                                'PARTIALLY_PAID',
                            ],
                        },
                        paidAt: {
                            $cond: [
                                {
                                    $eq: [
                                        { $subtract: ['$amountDue', amount] },
                                        0,
                                    ],
                                },
                                '$$NOW',
                                { $ifNull: ['$paidAt', null] },
                            ],
                        },
                    },
                },
            ],
            { new: true }
        );

        if (updatedInvoice) {
            return updatedInvoice;
        }

        const invoice = await Invoice.findById(invoiceId).select(
            '+appliedPaymentIds'
        );

        if (!invoice) {
            const error = new Error('Invoice not found');
            error.statusCode = 404;
            throw error;
        }

        if (invoice.appliedPaymentIds?.some((id) => id.equals(appliedPaymentId))) {
            return invoice;
        }

        if (invoice.status === 'CANCELLED') {
            const error = new Error('Cannot apply payment to a cancelled invoice');
            error.statusCode = 400;
            throw error;
        }

        if (amount > invoice.amountDue) {
            const error = new Error('Payment amount exceeds invoice amount due');
            error.statusCode = 400;
            throw error;
        }
    }

    const error = new Error('Invoice changed during payment application');
    error.statusCode = 409;
    throw error;
};

export const getInvoiceStatusesByAppointmentIds = async (appointmentIds) => {
    if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
        return [];
    }

    return Invoice.find({
        appointment: { $in: appointmentIds },
    })
        .select('appointment totalAmount amountDue status paidAt')
        .lean();
};