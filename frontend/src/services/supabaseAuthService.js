import axios from 'axios';
import { supabase, getAccessToken } from '../config/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SUPABASE_AUTH_ENDPOINT = `${API_URL}/api/auth/supabase`;

/**
 * Create axios instance with Supabase token interceptor
 */
const createAuthenticatedAxios = () => {
  const instance = axios.create({
    baseURL: API_URL,
  });

  // Add token to all requests
  instance.interceptors.request.use(
    async (config) => {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle token refresh on 401
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Refresh session with Supabase
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !session) {
            throw refreshError;
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          await supabase.auth.signOut();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const authAxios = createAuthenticatedAxios();

/**
 * Register a new user
 */
export const registerUser = async (userData) => {
  try {
    // Register with backend (creates both Supabase and MongoDB records)
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Login user
 */
export const loginUser = async (credentials) => {
  try {
    // Login via backend (authenticates with Supabase, returns MongoDB user data)
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/login`, credentials);
    
    // Store tokens and user data
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    // Logout from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Notify backend
    await authAxios.post(`${SUPABASE_AUTH_ENDPOINT}/logout`);
  } catch (error) {
    console.error('Logout error:', error);
    // Clear local storage even if backend call fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

/**
 * Get current user from backend
 */
export const getCurrentUser = async () => {
  try {
    const response = await authAxios.get(`${SUPABASE_AUTH_ENDPOINT}/me`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (token, type = 'signup') => {
  try {
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/verify-email`, {
      token,
      type,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Resend verification email
 */
export const resendVerification = async (email) => {
  try {
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/resend-verification`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check email verification status
 */
export const checkVerificationStatus = async (email) => {
  try {
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/check-verification`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${SUPABASE_AUTH_ENDPOINT}/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await authAxios.post(`${SUPABASE_AUTH_ENDPOINT}/reset-password`, {
      token,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await authAxios.put(`${SUPABASE_AUTH_ENDPOINT}/profile`, profileData);
    
    // Update local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...user, ...response.data.user };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await authAxios.post(
      `${SUPABASE_AUTH_ENDPOINT}/profile/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Update local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.profileImage = response.data.imageUrl;
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
};

/**
 * Get stored user data
 */
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  checkVerificationStatus,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadProfileImage,
  isAuthenticated,
  getStoredUser,
};
