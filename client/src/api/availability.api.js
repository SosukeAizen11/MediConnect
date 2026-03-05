import apiClient from './apiClient';

export const getMyAvailability = async () => {
    const response = await apiClient.get('/availability');
    return response.data;
};

export const createAvailability = async (data) => {
    const response = await apiClient.post('/availability', data);
    return response.data;
};

export const updateAvailability = async (id, data) => {
    const response = await apiClient.put(`/availability/${id}`, data);
    return response.data;
};

export const deleteAvailability = async (id) => {
    const response = await apiClient.delete(`/availability/${id}`);
    return response.data;
};
