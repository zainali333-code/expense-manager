import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (e.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export default api;
