import apiClient from './apiClient';

export const getApprovedClinics = async () => {
    const response = await apiClient.get('/clinics');
    return response.data;
};

export const getClinicById = async (clinicId) => {
    const response = await apiClient.get(`/clinics/${clinicId}`);
    return response.data;
};
