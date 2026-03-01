import apiClient from './apiClient';

export const getPosts = async () => {
    const response = await apiClient.get('/posts');
    return response.data;
};

export const createPost = async (data) => {
    const response = await apiClient.post('/posts', data);
    return response.data;
};

export const getMyPosts = async () => {
    const response = await apiClient.get('/posts/my');
    return response.data;
};

export const updatePost = async (postId, data) => {
    const response = await apiClient.put(`/posts/${postId}`, data);
    return response.data;
};

export const deletePost = async (postId) => {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
};
