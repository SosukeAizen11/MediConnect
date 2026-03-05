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

export const updateAppointmentStatus = async (id, status) => {
    const response = await apiClient.put(`/appointments/${id}/status`, { status });
    return response.data;
};

export const patchAppointmentStatus = async (id, status) => {
    const response = await apiClient.patch(`/appointments/${id}/status`, { status });
    return response.data;
};

export const completeConsultation = async (id, data) => {
    const response = await apiClient.put(`/appointments/${id}/consult`, data);
    return response.data;
};

export const getAppointmentDetails = async (id) => {
    const response = await apiClient.get(`/appointments/${id}/details`);
    return response.data;
};
