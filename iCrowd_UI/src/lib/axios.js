import axios from 'axios';
import { sessionToken, clearSession } from './session';
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  // Hosted database cold starts and transactional checkout can exceed 15 seconds.
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});
apiClient.interceptors.request.use(config => {
  const token = sessionToken();
  if (token && !config.headers.Authorization && !config.skipAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(response => response, error => {
  const credential = error.config?.headers?.Authorization;
  if (error.response?.status === 401 && credential?.startsWith('Bearer ')) clearSession(credential.slice(7));
  return Promise.reject(error);
});
