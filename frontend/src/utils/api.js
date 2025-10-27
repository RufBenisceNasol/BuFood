import { supabase } from './supabaseClient';

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session?.access_token) {
        localStorage.setItem('access_token', data.session.access_token);
        headers.Authorization = `Bearer ${data.session.access_token}`;
        response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
      }
    } catch (_) {
      // fall through; caller can handle 401
    }
  }

  return response;
}
