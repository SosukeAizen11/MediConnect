import apiClient from './apiClient';

export const getDoctorsByClinic = async (clinicId) => {
    const response = await apiClient.get(`/doctors/clinic/${clinicId}`);
    return response.data;
};

export const getDoctorProfile = async () => {
    const response = await apiClient.get('/doctors/profile');
    return response.data;
};

export const updateDoctorProfile = async (data) => {
    const response = await apiClient.put('/doctors/profile', data);
    return response.data;
};

export const getMyPatients = async () => {
    const response = await apiClient.get('/doctors/my-patients');
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await apiClient.get('/doctors/dashboard');
    return response.data;
};
