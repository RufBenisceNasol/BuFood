import axios from 'axios';

function getToken() {
  try {
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      ''
    );
  } catch (_) {
    return '';
  }
}

function resolveBaseURL() {
  const base = import.meta.env.VITE_API_BASE_URL || 'https://capstonedelibup-o7sl.onrender.com/api';
  return base;
}

const http = axios.create({ baseURL: resolveBaseURL(), withCredentials: false, timeout: 30000 });

// Seed default header at startup
(() => {
  const token = getToken();
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
})();

// Keep Authorization in sync across tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'access_token') {
      const t = getToken();
      if (t) http.defaults.headers.common.Authorization = `Bearer ${t}`;
      else delete http.defaults.headers.common.Authorization;
    }
  });
}

// Attach token automatically
http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[Axios] No token found for request:', config?.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401/403 globally
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      console.warn('[Axios] Auth error', status, '- clearing token and redirecting');
      try { localStorage.removeItem('access_token'); } catch (_) {}
      try { sessionStorage.removeItem('access_token'); } catch (_) {}
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default http;
