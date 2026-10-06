import Payment from '../models/payment.model.js';
import { getInvoiceById, recordPaymentSuccess } from '../../billing/index.js';
import { paymentGateway } from '../infrastructure/paymentGateway.js';

const ACTIVE_PAYMENT_STATUSES = ['PENDING', 'PROCESSING'];
const ORDER_CREATION_LEASE_MS = 120000;
const ORDER_CREATION_WAIT_ATTEMPTS = 40;
const ORDER_CREATION_WAIT_MS = 50;

const waitForPaymentOrder = async (paymentId) => {
    let currentPayment;

    for (let attempt = 0; attempt < ORDER_CREATION_WAIT_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, ORDER_CREATION_WAIT_MS));
        currentPayment = await Payment.findById(paymentId);

        if (currentPayment?.providerOrderId || currentPayment?.status === 'FAILED') {
            return currentPayment;
        }
    }

    return currentPayment;
};

const createPaymentOrder = async (payment) => {
    if (payment.providerOrderId) {
        return payment;
    }

    const now = new Date();
    const staleLeaseBefore = new Date(now.getTime() - ORDER_CREATION_LEASE_MS);
    const claimedPayment = await Payment.findOneAndUpdate(
        {
            _id: payment._id,
            status: { $in: ACTIVE_PAYMENT_STATUSES },
            providerOrderId: null,
            $or: [
                { orderCreationStartedAt: { $exists: false } },
                { orderCreationStartedAt: { $lt: staleLeaseBefore } },
            ],
        },
        { $set: { orderCreationStartedAt: now } },
        { new: true }
    );

    if (!claimedPayment) {
        const currentPayment = await waitForPaymentOrder(payment._id);
        if (currentPayment?.providerOrderId) {
            return currentPayment;
        }

        if (currentPayment?.status === 'FAILED') {
            return currentPayment;
        }

        const leaseStartedAt = currentPayment?.orderCreationStartedAt;
        if (
            ACTIVE_PAYMENT_STATUSES.includes(currentPayment?.status) &&
            (!leaseStartedAt ||
                leaseStartedAt.getTime() <= Date.now() - ORDER_CREATION_LEASE_MS)
        ) {
            return createPaymentOrder(currentPayment);
        }

        const error = new Error('Payment order is being initialized; retry shortly');
        error.statusCode = 409;
        throw error;
    }

    try {
        const order = await paymentGateway.createOrder({
            paymentId: claimedPayment._id,
            amount: claimedPayment.amount,
            currency: claimedPayment.currency,
        });

        const updatedPayment = await Payment.findOneAndUpdate(
            {
                _id: claimedPayment._id,
                status: { $in: ACTIVE_PAYMENT_STATUSES },
                orderCreationStartedAt: now,
            },
            {
                $set: { providerOrderId: order.id },
                $unset: { orderCreationStartedAt: 1 },
            },
            { new: true }
        );

        if (updatedPayment) {
            return updatedPayment;
        }

        const currentPayment = await Payment.findById(claimedPayment._id);
        if (currentPayment?.providerOrderId) {
            return currentPayment;
        }

        throw new Error('Payment order could not be saved');
    } catch (error) {
        await Payment.findOneAndUpdate(
            {
                _id: claimedPayment._id,
                status: { $in: ACTIVE_PAYMENT_STATUSES },
                orderCreationStartedAt: now,
            },
            {
                $set: {
                    status: 'FAILED',
                    failureReason: error.message || 'Failed to create payment order',
                },
                $unset: {
                    activeInvoice: 1,
                    orderCreationStartedAt: 1,
                },
            }
        );

        throw error;
    }
};

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
        if (
            ACTIVE_PAYMENT_STATUSES.includes(existingPayment.status) &&
            !existingPayment.providerOrderId
        ) {
            return createPaymentOrder(existingPayment);
        }
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
        return createPaymentOrder(activePayment);
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
            activeInvoice: invoice._id,
        });
    } catch (error) {
        // The active-invoice or idempotency index may have won the race.
        if (error.code === 11000) {
            const sameKeyPayment = await Payment.findOne({
                patient: patientId,
                idempotencyKey,
            });

            if (sameKeyPayment) {
                if (
                    ACTIVE_PAYMENT_STATUSES.includes(sameKeyPayment.status) &&
                    !sameKeyPayment.providerOrderId
                ) {
                    return createPaymentOrder(sameKeyPayment);
                }
                return sameKeyPayment;
            }

            const racedActivePayment = await Payment.findOne({
                invoice: invoice._id,
                status: { $in: ACTIVE_PAYMENT_STATUSES },
            });

            if (racedActivePayment) {
                return createPaymentOrder(racedActivePayment);
            }
        }

        throw error;
    }

    return createPaymentOrder(payment);
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
        const failedPayment = await Payment.findOneAndUpdate(
            { _id: payment._id, status: 'PENDING' },
            {
                $set: {
                    status: 'FAILED',
                    failureReason: 'Invalid Razorpay payment signature',
                },
                $unset: { activeInvoice: 1 },
            },
            { new: true }
        );

        if (!failedPayment) {
            const currentPayment = await Payment.findById(payment._id);
            if (currentPayment?.status === 'SUCCEEDED') {
                return currentPayment;
            }
        }

        const error = new Error('Payment verification failed');
        error.statusCode = 400;
        throw error;
    }

    if (payment.status === 'PENDING') {
        const claimedPayment = await Payment.findOneAndUpdate(
            {
                _id: payment._id,
                patient: patientId,
                status: 'PENDING',
                providerOrderId: razorpayOrderId,
            },
            { $set: { status: 'PROCESSING' } },
            { new: true }
        );

        if (claimedPayment) {
            payment.status = claimedPayment.status;
        } else {
            const currentPayment = await Payment.findById(payment._id);
            if (currentPayment?.status === 'SUCCEEDED') {
                return currentPayment;
            }
            if (currentPayment?.status !== 'PROCESSING') {
                const error = new Error('Payment is no longer available for verification');
                error.statusCode = 409;
                throw error;
            }
            payment.status = currentPayment.status;
        }
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
        paymentId: payment._id,
        amount: payment.amount,
    });

    const succeededPayment = await Payment.findOneAndUpdate(
        {
            _id: payment._id,
            status: 'PROCESSING',
            providerOrderId: razorpayOrderId,
        },
        {
            $set: {
                status: 'SUCCEEDED',
                providerPaymentId: razorpayPaymentId,
                paidAt: new Date(),
                failureReason: null,
            },
            $unset: { activeInvoice: 1, orderCreationStartedAt: 1 },
        },
        { new: true }
    );

    if (succeededPayment) {
        return succeededPayment;
    }

    const currentPayment = await Payment.findById(payment._id);
    if (currentPayment?.status === 'SUCCEEDED') {
        return currentPayment;
    }

    const error = new Error('Payment could not be finalized');
    error.statusCode = 409;
    throw error;
};