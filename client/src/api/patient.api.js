import apiClient from './apiClient';

export const getProfile = async () => {
    const response = await apiClient.get('/patient/profile');
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await apiClient.put('/patient/profile', profileData);
    return response.data;
};
