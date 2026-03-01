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

export const getDoctorTokenQueue = async () => {
    const response = await apiClient.get('/tokens/doctor');
    return response.data;
};

export const advanceToken = async () => {
    const response = await apiClient.put('/tokens/next');
    return response.data;
};

export const getTokenDetails = async (tokenId) => {
    const response = await apiClient.get(`/tokens/${tokenId}/details`);
    return response.data;
};

export const completeTokenConsultation = async (tokenId, data) => {
    const response = await apiClient.put(`/tokens/${tokenId}/complete`, data);
    return response.data;
};
