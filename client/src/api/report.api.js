import apiClient from './apiClient';

export const uploadReport = async (formData) => {
    const response = await apiClient.post('/reports', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMyReports = async () => {
    const response = await apiClient.get('/reports/my-reports');
    return response.data;
};

export const deleteReport = async (id) => {
    const response = await apiClient.delete(`/reports/${id}`);
    return response.data;
};

export const getPatientReports = async (patientId) => {
    const response = await apiClient.get(`/reports/patient/${patientId}`);
    return response.data;
};
