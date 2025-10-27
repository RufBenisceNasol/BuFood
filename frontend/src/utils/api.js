import { supabase } from './supabaseClient';

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Always ask Supabase for the freshest session before sending
  let sessionToken = null;
  try {
    const { data } = await supabase.auth.getSession();
    sessionToken = data?.session?.access_token || null;
  } catch (_) {
    sessionToken = null;
  }

  if (!sessionToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error) sessionToken = data?.session?.access_token || null;
    } catch (_) {}
  }

  // Fallback to any stored token if session not available
  const stored = localStorage.getItem('access_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
  const token = sessionToken || stored || '';
  if (token) {
    try { localStorage.setItem('access_token', token); } catch (_) {}
  }

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
        const newToken = data.session.access_token;
        try { localStorage.setItem('access_token', newToken); } catch (_) {}
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers: retryHeaders });
      }
    } catch (_) {
      // fall through; caller can handle 401
    }
  }

  return response;
}
