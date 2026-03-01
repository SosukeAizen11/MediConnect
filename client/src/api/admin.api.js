import apiClient from './apiClient';

export const getPendingClinics = async () => {
    const response = await apiClient.get('/admin/clinics/pending');
    return response.data;
};

export const approveClinic = async (id) => {
    const response = await apiClient.put(`/admin/clinics/${id}/approve`);
    return response.data;
};

export const rejectClinic = async (id) => {
    const response = await apiClient.delete(`/admin/clinics/${id}`);
    return response.data;
};

export const getAllClinics = async () => {
    const response = await apiClient.get('/admin/clinics');
    return response.data;
};

export const toggleClinicStatus = async (id) => {
    const response = await apiClient.put(`/admin/clinics/${id}/toggle`);
    return response.data;
};

export const deleteClinic = async (id) => {
    const response = await apiClient.delete(`/admin/clinics/${id}`);
    return response.data;
};
