import apiClient from './apiClient';

export const getSlots = async (doctorId, date) => {
    const response = await apiClient.get(`/slots?doctorId=${doctorId}&date=${date}`);
    return response.data;
};
