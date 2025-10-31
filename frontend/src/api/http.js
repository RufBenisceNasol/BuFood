import axios from 'axios';
import { supabase } from '../supabaseClient';

const base = import.meta.env.VITE_API_BASE_URL; // includes /api

const http = axios.create({ baseURL: base });

// Wait briefly for Supabase session to exist (handles app boot and token refresh)
async function waitForSession(msTotal = 1200, stepMs = 150) {
  const start = Date.now();
  while (Date.now() - start < msTotal) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) return token;
    } catch (_) {}
    await new Promise(r => setTimeout(r, stepMs));
  }
  return null;
}

http.interceptors.request.use(async (config) => {
  try {
    // First attempt: immediate session read
    const { data } = await supabase.auth.getSession();
    let token = data?.session?.access_token;

    // If no token yet, wait briefly (app just loaded or token rotating)
    if (!token) {
      console.warn('[HTTP] No token found initially for', config.url, '— waiting for session...');
      token = await waitForSession();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.DEV) console.log('[HTTP] Attached Supabase token');
    } else {
      console.warn('[HTTP] No token found for request', config.url);
    }
  } catch (err) {
    console.error('[HTTP] Error attaching token:', err);
  }
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
