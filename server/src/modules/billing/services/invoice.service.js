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

export const recordPaymentSuccess = async ({ invoiceId, amount }) => {
    if (!invoiceId) {
        throw new Error('Invoice ID is required');
    }

    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('Payment amount must be a positive integer in paise');
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }

    if (invoice.status === 'CANCELLED') {
        const error = new Error('Cannot apply payment to a cancelled invoice');
        error.statusCode = 400;
        throw error;
    }

    /*
     * If this payment has already been applied,
     * don't subtract the amount again.
     */
    if (invoice.amountDue === 0) {
        return invoice;
    }

    if (amount > invoice.amountDue) {
        const error = new Error('Payment amount exceeds invoice amount due');
        error.statusCode = 400;
        throw error;
    }

    invoice.amountDue -= amount;

    if (invoice.amountDue === 0) {
        invoice.status = 'PAID';
        invoice.paidAt = new Date();
    } else {
        invoice.status = 'PARTIALLY_PAID';
    }

    await invoice.save();

    return invoice;
};