import apiClient from './apiClient';

export const bookAppointment = async (data) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
};

export const getPatientAppointments = async () => {
    const response = await apiClient.get('/appointments/patient');
    return response.data;
};

export const getDoctorAppointments = async () => {
    const response = await apiClient.get('/appointments/doctor');
    return response.data;
};
