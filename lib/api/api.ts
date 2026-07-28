import axios from 'axios';
import { clientApi } from './clientApi';
import type { Category, CreateStoryResponse } from '@/types/story';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createStory(
  formData: FormData
): Promise<CreateStoryResponse> {
  const { data } = await clientApi.post<CreateStoryResponse>(
    '/stories',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return data;
}
export async function fetchCategories(): Promise<Category[]> {
  const { data } = await clientApi.get('/categories');
  return data as Category[];
}
