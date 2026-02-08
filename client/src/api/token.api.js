import apiClient from './apiClient';

export const joinTokenQueue = async (clinicId) => {
    const response = await apiClient.post('/tokens/join', { clinicId });
    return response.data;
};

export const getPatientTokens = async () => {
    const response = await apiClient.get('/tokens/patient');
    return response.data;
};

export const getMyToken = async () => {
    const response = await apiClient.get('/tokens/my');
    return response.data;
};
