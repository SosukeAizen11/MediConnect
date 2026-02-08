import apiClient from './apiClient';

export const getPosts = async () => {
    const response = await apiClient.get('/posts');
    return response.data;
};
