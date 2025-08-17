import axios from 'axios';
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
export const api = axios.create({ baseURL: API_BASE + '/api', withCredentials: true });

api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      window.dispatchEvent(new Event('api-unauthorized'));
    }
    return Promise.reject(err);
  }
);
