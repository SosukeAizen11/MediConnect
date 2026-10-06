import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.RAZORPAY_KEY_ID ||= 'rzp_test_unit';
process.env.RAZORPAY_KEY_SECRET ||= 'unit-test-secret';

const [
    { default: Payment },
    { default: Invoice },
    { paymentGateway },
    { createPayment, verifyPayment },
] = await Promise.all([
    import('../src/modules/payments/models/payment.model.js'),
    import('../src/modules/billing/models/invoice.model.js'),
    import('../src/modules/payments/infrastructure/paymentGateway.js'),
    import('../src/modules/payments/services/payment.service.js'),
]);

const newId = () => new mongoose.Types.ObjectId();

const asQuery = (value) => ({
    select() {
        return this;
    },
    then(resolve, reject) {
        return Promise.resolve(value).then(resolve, reject);
    },
});

const makePayment = ({ status = 'PENDING', invoiceId, patientId } = {}) => ({
    _id: newId(),
    invoice: invoiceId || newId(),
    patient: patientId || newId(),
    amount: 10000,
    currency: 'INR',
    provider: 'RAZORPAY',
    status,
    providerOrderId: 'order_test_1',
    providerPaymentId: null,
    activeInvoice: invoiceId || newId(),
    idempotencyKey: `key-${newId()}`,
});

const mockInvoiceStore = (t, invoice) => {
    t.mock.method(Invoice, 'findById', () => asQuery(invoice));
    t.mock.method(Invoice, 'findOneAndUpdate', async (filter, pipeline) => {
        const invoiceUpdate = pipeline[0].$set;
        const paymentId = filter.appliedPaymentIds.$ne;
        assert.deepEqual(invoiceUpdate.amountDue.$subtract, [
            '$amountDue',
            filter.amountDue.$gte,
        ]);
        assert.deepEqual(invoiceUpdate.appliedPaymentIds.$setUnion[1], [
            { $literal: paymentId },
        ]);
        const alreadyApplied = invoice.appliedPaymentIds.some((id) =>
            id.equals(paymentId)
        );

        if (
            alreadyApplied ||
            invoice.status === 'CANCELLED' ||
            invoice.amountDue < filter.amountDue.$gte
        ) {
            return null;
        }

        invoice.amountDue -= filter.amountDue.$gte;
        invoice.appliedPaymentIds.push(paymentId);
        invoice.status = invoice.amountDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
        if (invoice.amountDue === 0) {
            invoice.paidAt = new Date();
        }

        return { ...invoice };
    });
};

const mockVerificationPayment = (t, payment) => {
    let successTransitions = 0;
    t.mock.method(Payment, 'findById', async () => ({ ...payment }));
    t.mock.method(Payment, 'findOneAndUpdate', async (filter, update) => {
        if (filter.status === 'PENDING' && payment.status === 'PENDING') {
            payment.status = update.$set.status;
            if (update.$set.providerPaymentId) {
                payment.providerPaymentId = update.$set.providerPaymentId;
            }
            if (update.$set.paidAt) {
                payment.paidAt = update.$set.paidAt;
            }
            if (update.$unset?.activeInvoice) {
                payment.activeInvoice = undefined;
            }
            return { ...payment };
        }

        if (filter.status === 'PROCESSING' && payment.status === 'PROCESSING') {
            if (update.$set.status === 'SUCCEEDED') {
                successTransitions += 1;
            }
            payment.status = update.$set.status;
            payment.providerPaymentId = update.$set.providerPaymentId;
            payment.paidAt = update.$set.paidAt;
            payment.activeInvoice = undefined;
            return { ...payment };
        }

        return null;
    });
    return () => successTransitions;
};

const verificationInput = (payment) => ({
    paymentId: payment._id,
    patientId: payment.patient,
    razorpayOrderId: payment.providerOrderId,
    razorpayPaymentId: 'pay_test_1',
    razorpaySignature: 'signature_test_1',
});

test('repeated concurrent verification applies the invoice payment once', async (t) => {
    const payment = makePayment();
    const invoice = {
        _id: payment.invoice,
        patient: payment.patient,
        amountDue: payment.amount,
        status: 'ISSUED',
        appliedPaymentIds: [],
        paidAt: null,
    };
    const getSuccessTransitions = mockVerificationPayment(t, payment);
    mockInvoiceStore(t, invoice);
    t.mock.method(paymentGateway, 'verifyPayment', () => true);

    const results = await Promise.all([
        verifyPayment(verificationInput(payment)),
        verifyPayment(verificationInput(payment)),
    ]);
    const repeatedResult = await verifyPayment(verificationInput(payment));

    assert.equal(results.every((result) => result.status === 'SUCCEEDED'), true);
    assert.equal(repeatedResult.status, 'SUCCEEDED');
    assert.equal(invoice.amountDue, 0);
    assert.equal(invoice.status, 'PAID');
    assert.equal(invoice.appliedPaymentIds.length, 1);
    assert.equal(payment.status, 'SUCCEEDED');
    assert.equal(payment.providerPaymentId, 'pay_test_1');
    assert.equal(getSuccessTransitions(), 1);
});

test('already-SUCCEEDED verification returns without reapplying payment', async (t) => {
    const payment = makePayment({ status: 'SUCCEEDED' });
    t.mock.method(Payment, 'findById', async () => ({ ...payment }));
    const gatewayVerify = t.mock.method(paymentGateway, 'verifyPayment', () => true);
    const invoiceUpdate = t.mock.method(Invoice, 'findOneAndUpdate', async () => {
        throw new Error('Invoice must not be updated');
    });

    const result = await verifyPayment(verificationInput(payment));

    assert.equal(result.status, 'SUCCEEDED');
    assert.equal(gatewayVerify.mock.calls.length, 0);
    assert.equal(invoiceUpdate.mock.calls.length, 0);
});

test('invalid Razorpay signature fails only the pending attempt', async (t) => {
    const payment = makePayment();
    t.mock.method(Payment, 'findById', async () => ({ ...payment }));
    t.mock.method(Payment, 'findOneAndUpdate', async (_filter, update) => {
        payment.status = update.$set.status;
        payment.activeInvoice = undefined;
        return { ...payment };
    });
    t.mock.method(paymentGateway, 'verifyPayment', () => false);

    await assert.rejects(
        verifyPayment(verificationInput(payment)),
        /Payment verification failed/
    );

    assert.equal(payment.status, 'FAILED');
    assert.equal(payment.activeInvoice, undefined);
});

test('concurrent initiation creates one active payment and one provider order', async (t) => {
    const activeInvoiceIndex = Payment.schema.indexes().find(
        ([keys, options]) =>
            keys.activeInvoice === 1 && options.unique && options.sparse
    );
    assert.ok(activeInvoiceIndex, 'Expected a sparse unique active-invoice index');

    const invoiceId = newId();
    const patientId = newId();
    const activePayments = [];
    let activeLookupCount = 0;
    let releaseLookups;
    const bothLookups = new Promise((resolve) => {
        releaseLookups = resolve;
    });
    let orderClaimCount = 0;
    let releaseClaims;
    const bothClaims = new Promise((resolve) => {
        releaseClaims = resolve;
    });
    let finishOrder;
    const orderResult = new Promise((resolve) => {
        finishOrder = resolve;
    });

    t.mock.method(Invoice, 'findById', () =>
        asQuery({
            _id: invoiceId,
            patient: patientId,
            amountDue: 10000,
            status: 'ISSUED',
        })
    );
    t.mock.method(Payment, 'findOne', async (filter) => {
        if (filter.patient) {
            return null;
        }

        activeLookupCount += 1;
        if (activeLookupCount === 2) {
            releaseLookups();
        }
        await bothLookups;

        if (activePayments.length > 0) {
            return activePayments[0];
        }
        return null;
    });
    t.mock.method(Payment, 'create', async (document) => {
        if (activePayments.length > 0) {
            const error = new Error('Duplicate active invoice');
            error.code = 11000;
            throw error;
        }

        const payment = {
            ...document,
            _id: newId(),
            orderCreationStartedAt: undefined,
        };
        activePayments.push(payment);
        return payment;
    });
    t.mock.method(Payment, 'findOneAndUpdate', async (filter, update) => {
        const payment = activePayments[0];
        if (update.$set?.providerOrderId) {
            payment.providerOrderId = update.$set.providerOrderId;
            payment.orderCreationStartedAt = undefined;
            return { ...payment };
        }

        if (!payment || payment.orderCreationStartedAt) {
            orderClaimCount += 1;
            if (orderClaimCount === 2) {
                releaseClaims();
            }
            return null;
        }

        payment.orderCreationStartedAt = update.$set.orderCreationStartedAt;
        orderClaimCount += 1;
        if (orderClaimCount === 2) {
            releaseClaims();
        }
        return { ...payment };
    });
    t.mock.method(Payment, 'findById', async () => ({ ...activePayments[0] }));
    const createOrder = t.mock.method(paymentGateway, 'createOrder', async () => {
        await orderResult;
        return { id: 'order_concurrent_1' };
    });

    const initiations = Promise.allSettled([
        createPayment({ invoiceId, patientId, idempotencyKey: 'attempt-a' }),
        createPayment({ invoiceId, patientId, idempotencyKey: 'attempt-b' }),
    ]);

    await bothClaims;
    assert.equal(activePayments.length, 1);
    assert.equal(createOrder.mock.calls.length, 1);
    finishOrder({ id: 'order_concurrent_1' });

    const results = await initiations;
    assert.equal(results.every((result) => result.status === 'fulfilled'), true);
    assert.equal(
        results[0].value._id.toString(),
        results[1].value._id.toString()
    );
    assert.equal(results[0].value.providerOrderId, 'order_concurrent_1');
    assert.equal(results[1].value.providerOrderId, 'order_concurrent_1');
    assert.equal(activePayments.filter((item) => item.status === 'PENDING').length, 1);
    assert.equal(createOrder.mock.calls.length, 1);
});

test('invoice with no outstanding amount cannot create a payment', async (t) => {
    const invoiceId = newId();
    const patientId = newId();
    t.mock.method(Payment, 'findOne', async () => null);
    t.mock.method(Invoice, 'findById', () =>
        asQuery({
            _id: invoiceId,
            patient: patientId,
            amountDue: 0,
            status: 'PAID',
        })
    );
    const paymentCreate = t.mock.method(Payment, 'create', async () => {
        throw new Error('Payment must not be created');
    });

    await assert.rejects(
        createPayment({ invoiceId, patientId, idempotencyKey: 'zero-due' }),
        /no outstanding amount/
    );

    assert.equal(paymentCreate.mock.calls.length, 0);
});

test('a new idempotency key can retry after a failed payment', async (t) => {
    const invoiceId = newId();
    const patientId = newId();
    const priorFailure = makePayment({ invoiceId, patientId, status: 'FAILED' });
    priorFailure.activeInvoice = undefined;
    const createdPayments = [];
    t.mock.method(Payment, 'findOne', async (filter) => {
        if (filter.patient) {
            return filter.idempotencyKey === priorFailure.idempotencyKey
                ? priorFailure
                : null;
        }
        return null;
    });
    t.mock.method(Invoice, 'findById', () =>
        asQuery({
            _id: invoiceId,
            patient: patientId,
            amountDue: 10000,
            status: 'ISSUED',
        })
    );
    t.mock.method(Payment, 'create', async (document) => {
        const payment = { ...document, _id: newId() };
        createdPayments.push(payment);
        return payment;
    });
    t.mock.method(Payment, 'findOneAndUpdate', async (_filter, update) => {
        createdPayments[0].providerOrderId = 'order_retry_1';
        return {
            ...createdPayments[0],
            ...update.$set,
        };
    });
    t.mock.method(paymentGateway, 'createOrder', async () => ({ id: 'order_retry_1' }));

    const retriedPayment = await createPayment({
        invoiceId,
        patientId,
        idempotencyKey: 'attempt-after-failure',
    });

    assert.equal(createdPayments.length, 1);
    assert.equal(retriedPayment.status, 'PENDING');
    assert.equal(retriedPayment.providerOrderId, 'order_retry_1');
    assert.equal(retriedPayment.activeInvoice.toString(), invoiceId.toString());
});