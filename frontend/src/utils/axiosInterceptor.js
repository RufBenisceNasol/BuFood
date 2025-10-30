import axios from 'axios';
import { supabase } from '../supabaseClient';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

axios.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // optional warn
        // console.warn('[Axios] No token found – user might not be logged in.');
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

export default axios;
