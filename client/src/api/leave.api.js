import apiClient from './apiClient';

export const getMyLeaves = async () => {
    const response = await apiClient.get('/leaves');
    return response.data;
};

export const createLeave = async (data) => {
    const response = await apiClient.post('/leaves', data);
    return response.data;
};

export const deleteLeave = async (id) => {
    const response = await apiClient.delete(`/leaves/${id}`);
    return response.data;
};
