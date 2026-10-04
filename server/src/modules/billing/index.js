/**
 * Billing Module Public Facade
 *
 * Billing owns invoice creation and invoice lifecycle.
 */

export {
    createConsultationInvoice,
    getInvoiceByConsultationId,
    getPatientInvoices,
    getInvoiceById,
    recordPaymentSuccess,
} from './services/invoice.service.js';