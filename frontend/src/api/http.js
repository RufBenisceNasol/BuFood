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

export default http;
