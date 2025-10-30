import axios from 'axios';
import { supabase } from '../supabaseClient';

const base = import.meta.env.VITE_API_BASE_URL; // includes /api

const http = axios.create({ baseURL: base });

http.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// Response interceptor to gracefully handle auth errors
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config || {};
    if ((status === 401 || status === 403) && !original._retry) {
      try {
        original._retry = true;
        // Re-read the current session (Supabase rotates tokens automatically)
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          return http(original);
        }
      } catch (_) {}
      // No valid session — sign out and redirect to login
      try { await supabase.auth.signOut(); } catch (_) {}
      try { localStorage.removeItem('access_token'); } catch (_) {}
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
