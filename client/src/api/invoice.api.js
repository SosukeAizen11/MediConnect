import apiClient from './apiClient';

export const getMyInvoices = async () => {
    const response = await apiClient.get('/invoices/my');
    return response.data;
};