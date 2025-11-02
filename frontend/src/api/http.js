import axios from 'axios';
import { supabase } from '../supabaseClient';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://capstonedelibup-o7sl.onrender.com/api',
  timeout: 30000,
});

// Attach Supabase token automatically on every request
http.interceptors.request.use(
  async (config) => {
    // If an Authorization header is already set (by useSupabaseAxiosSync), don't fetch session again
    if (config?.headers?.Authorization) {
      return config;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // Silent: callers will handle 401s; avoid noisy logs during token refresh races
    }
    // If sending FormData, ensure we let the browser set the multipart boundary
    if (config?.data instanceof FormData) {
      config.headers = config.headers || {};
      // Delete any preset Content-Type so axios/browser can inject the correct boundary
      delete config.headers['Content-Type'];
    } else {
      // For non-FormData requests, default to JSON if not explicitly set
      config.headers = config.headers || {};
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401/403 handler (soft): don't redirect here; let route guards decide
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default http;
