import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'; // Fallback to localhost

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API endpoints
export const auth = {
    // Register new user
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Login user
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Verify email with token
    verifyEmail: async (token) => {
        try {
            const response = await api.get(`/auth/verify/${token}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get current user profile
    getMe: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Resend verification email
    resendVerification: async () => {
        try {
            const response = await api.post('/auth/resend-verification');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Check email verification status
    checkVerification: async () => {
        try {
            const response = await api.post('/auth/check-verification');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Utility function to check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Utility function to logout (clear token)
    logout: () => {
        localStorage.removeItem('token');
    }
};

export default api;