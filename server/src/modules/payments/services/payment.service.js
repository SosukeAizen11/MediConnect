import Payment from '../models/payment.model.js';
import { getInvoiceById, recordPaymentSuccess } from '../../billing/index.js';
import { paymentGateway } from '../infrastructure/paymentGateway.js';

export const createPayment = async ({
    invoiceId,
    patientId,
    idempotencyKey,
}) => {
    if (!invoiceId) {
        throw new Error('Invoice ID is required');
    }

    if (!patientId) {
        throw new Error('Patient ID is required');
    }

    if (!idempotencyKey) {
        const error = new Error('Idempotency key is required');
        error.statusCode = 400;
        throw error;
    }

    // ---------------------------------------------------------
    // 1. Exact retry protection
    // ---------------------------------------------------------
    const existingPayment = await Payment.findOne({
        patient: patientId,
        idempotencyKey,
    });

    if (existingPayment) {
        return existingPayment;
    }

    // ---------------------------------------------------------
    // 2. Retrieve invoice through Billing facade
    // ---------------------------------------------------------
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }

    // ---------------------------------------------------------
    // 3. Verify invoice ownership
    // ---------------------------------------------------------
    if (invoice.patient.toString() !== patientId.toString()) {
        const error = new Error(
            'You are not authorized to pay this invoice'
        );
        error.statusCode = 403;
        throw error;
    }

    // ---------------------------------------------------------
    // 4. Validate invoice state
    // ---------------------------------------------------------
    if (invoice.status === 'CANCELLED') {
        const error = new Error('This invoice has been cancelled');
        error.statusCode = 400;
        throw error;
    }

    if (invoice.amountDue <= 0) {
        const error = new Error(
            'This invoice has no outstanding amount'
        );
        error.statusCode = 400;
        throw error;
    }

    // ---------------------------------------------------------
    // 5. Check for an existing active payment attempt
    // ---------------------------------------------------------
    const activePayment = await Payment.findOne({
        invoice: invoice._id,
        status: {
            $in: ['PENDING', 'PROCESSING'],
        },
    });

    if (activePayment) {
        // An older PENDING payment may have been created before
        // Razorpay integration was added.
        if (!activePayment.providerOrderId) {
            try {
                const order = await paymentGateway.createOrder({
                    paymentId: activePayment._id,
                    amount: activePayment.amount,
                    currency: activePayment.currency,
                });

                activePayment.providerOrderId = order.id;
                await activePayment.save();
            } catch (error) {
                activePayment.status = 'FAILED';
                activePayment.failureReason =
                    error.message || 'Failed to create payment order';

                await activePayment.save();

                throw error;
            }
        }

        return activePayment;
    }

    // ---------------------------------------------------------
    // 6. Create our local payment attempt
    // ---------------------------------------------------------
    let payment;

    try {
        payment = await Payment.create({
            invoice: invoice._id,
            patient: invoice.patient,
            amount: invoice.amountDue,
            currency: 'INR',
            provider: 'RAZORPAY',
            status: 'PENDING',
            idempotencyKey,
        });
    } catch (error) {
        // Another identical request may have won the race.
        if (error.code === 11000) {
            return Payment.findOne({
                patient: patientId,
                idempotencyKey,
            });
        }

        throw error;
    }

    // ---------------------------------------------------------
    // 7. Create Razorpay order
    // ---------------------------------------------------------
    try {
        const order = await paymentGateway.createOrder({
            paymentId: payment._id,
            amount: payment.amount,
            currency: payment.currency,
        });

        // -----------------------------------------------------
        // 8. Store Razorpay's order ID
        // -----------------------------------------------------
        payment.providerOrderId = order.id;

        await payment.save();

        return payment;
    } catch (error) {
        // Razorpay order creation failed.
        // Preserve the payment attempt for auditing/retry.
        payment.status = 'FAILED';
        payment.failureReason =
            error.message || 'Failed to create Razorpay order';

        await payment.save();

        throw error;
    }
};

export const getPaymentsByInvoiceId = async (invoiceId) => {
    return Payment.find({
        invoice: invoiceId,
    }).sort({ createdAt: -1 });
};

export const getPaymentById = async (paymentId) => {
    return Payment.findById(paymentId);
};

export const verifyPayment = async ({
    paymentId,
    patientId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
}) => {
    if (!paymentId) {
        throw new Error('Payment ID is required');
    }

    if (!patientId) {
        throw new Error('Patient ID is required');
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new Error('Incomplete Razorpay payment verification data');
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404;
        throw error;
    }

    if (payment.patient.toString() !== patientId.toString()) {
        const error = new Error('You are not authorized to verify this payment');
        error.statusCode = 403;
        throw error;
    }

    /*
     * Idempotency for verification.
     *
     * If this payment has already been successfully processed,
     * return it without applying the invoice payment again.
     */
    if (payment.status === 'SUCCEEDED') {
        return payment;
    }

    if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
        const error = new Error(
            `Payment cannot be verified from status ${payment.status}`
        );
        error.statusCode = 400;
        throw error;
    }

    /*
     * Make sure the Razorpay order returned by the browser
     * is the same order created by our backend.
     */
    if (payment.providerOrderId !== razorpayOrderId) {
        const error = new Error('Razorpay order does not match payment');
        error.statusCode = 400;
        throw error;
    }

    /*
     * Verify Razorpay's cryptographic signature.
     */
    const isValid = paymentGateway.verifyPayment({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
    });

    if (!isValid) {
        payment.status = 'FAILED';
        payment.failureReason = 'Invalid Razorpay payment signature';

        await payment.save();

        const error = new Error('Payment verification failed');
        error.statusCode = 400;
        throw error;
    }

    /*
     * Verify the invoice before marking the payment successful.
     */
    const invoice = await getInvoiceById(payment.invoice);

    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }

    if (invoice.patient.toString() !== patientId.toString()) {
        const error = new Error('Invoice does not belong to this patient');
        error.statusCode = 403;
        throw error;
    }

    /*
     * Apply the successful payment to Billing.
     */
    await recordPaymentSuccess({
        invoiceId: payment.invoice,
        amount: payment.amount,
    });

    /*
     * Only after Billing accepts the payment do we mark
     * our Payment record as successful.
     */
    payment.status = 'SUCCEEDED';
    payment.providerPaymentId = razorpayPaymentId;
    payment.paidAt = new Date();
    payment.failureReason = null;

    await payment.save();

    return payment;
};