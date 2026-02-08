import apiClient from './apiClient';

export const getDoctorsByClinic = async (clinicId) => {
    const response = await apiClient.get(`/doctors/clinic/${clinicId}`);
    return response.data;
};
