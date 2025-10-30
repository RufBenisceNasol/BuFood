import http from './http';

export async function fetchBootstrap(params = {}) {
  const { data } = await http.get('/bootstrap', { params });
  return data;
}
