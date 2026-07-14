import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.success === false) {
      return Promise.reject(
        new Error(response.data.error?.message ?? 'Request failed')
      );
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'Request failed';
    return Promise.reject(new Error(message));
  }
);

export function getData<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

export default api;
