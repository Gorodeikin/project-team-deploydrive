// lib/api/auth.ts
import { apiClient } from './apiClient';
import type { User } from '@/types/user';

export const login = async (data: {
  email: string;
  password: string;
}): Promise<User> => {
  const r = await apiClient.post('/auth/login', data);

  const token = r.data?.data?.accessToken;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Login failed: no access token received');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }

  try {
    const meRes = await apiClient.get('/users/me/profile');
    const user = meRes.data?.data?.user ?? meRes.data?.data;

    if (!user) {
      throw new Error('Login failed: unable to load user profile');
    }

    return user;
  } catch (err) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    throw err;
  }
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> => {
  await apiClient.post('/auth/register', data);

  return login({ email: data.email, password: data.password });
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
};

export const getMe = async (): Promise<User | null> => {
  try {
    const r = await apiClient.get('/users/me/profile'); // или /users/me если так у вас
    return r.data?.data ?? null;
  } catch {
    return null;
  }
};

// чтобы не спамить 401 когда токена нет
export const checkSession = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    await apiClient.get('/users/me/profile');
    return true;
  } catch {
    return false;
  }
};
