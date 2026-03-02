import apiClient from './apiClient';

export const getPosts = async () => {
    const response = await apiClient.get('/posts');
    return response.data;
};

export const createPost = async (data) => {
    // If data is FormData, axios will automatically set the correct Content-Type (multipart/form-data)
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

export const toggleLike = async (postId) => {
    const response = await apiClient.put(`/posts/${postId}/like`);
    return response.data;
};

export const addComment = async (postId, text) => {
    const response = await apiClient.post(`/posts/${postId}/comment`, { text });
    return response.data;
};

export const deleteComment = async (postId, commentId) => {
    const response = await apiClient.delete(`/posts/${postId}/comment/${commentId}`);
    return response.data;
};
