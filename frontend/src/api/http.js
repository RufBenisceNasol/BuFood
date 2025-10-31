import axios from 'axios';
import { supabase } from '../supabaseClient';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://capstonedelibup-o7sl.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach Supabase token automatically on every request
http.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[Axios] No token found for request:', config?.url);
      }
    } catch (err) {
      console.error('[Axios] Failed to read Supabase session:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401/403 handler
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.warn('[Axios] Unauthorized — redirecting to /login');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default http;
