import http from './http';

export async function fetchBootstrap(params = {}) {
  try {
    const { data } = await http.get('/bootstrap', { params });
    return data;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) {
      // Not authorized for aggregated endpoint; let caller fall back silently
      return null;
    }
    throw err;
  }
}
