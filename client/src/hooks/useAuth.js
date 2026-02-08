import { loginUser } from '../api/auth.api';

export const useAuth = () => {
    const login = async (email, password) => {
        try {
            const data = await loginUser({ email, password });
            localStorage.setItem('token', data.token);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            throw new Error(message);
        }
    };

    return { login };
};
