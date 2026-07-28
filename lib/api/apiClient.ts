// lib/api/Apiclient.ts
'use client';

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
});

// --- ROUTES that must NOT receive Authorization header
const AUTH_WHITELIST = ['/auth/login', '/auth/register', '/auth/refresh'];

// ====== REQUEST: добавляем accessToken (кроме auth) ======
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isAuthRoute = AUTH_WHITELIST.some(p => config.url?.includes(p));

  if (!isAuthRoute && typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ====== RESPONSE: refresh token ======
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh')
      .then(res => {
        const token = res.data?.data?.accessToken;
        if (!token) throw new Error('Refresh returned no accessToken');

        localStorage.setItem('accessToken', token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
      }
    }

    return Promise.reject(error);
  }
);
