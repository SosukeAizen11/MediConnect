/**
 * Billing Module Public Facade
 *
 * Billing owns invoice creation and invoice lifecycle.
 */

export {
    createConsultationInvoice,
    getInvoiceByConsultationId,
    getPatientInvoices,
} from './services/invoice.service.js';