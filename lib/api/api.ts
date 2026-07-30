import axios from 'axios';
import { apiClient as authenticatedApiClient } from './apiClient';
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

interface RawStory {
  _id: string;
  [key: string]: unknown;
}

interface RawCategory {
  _id: string;
  name: string;
}

export async function createStory(
  formData: FormData
): Promise<CreateStoryResponse> {
  const response = await authenticatedApiClient.post('/stories', formData);

  const createdStory: RawStory | undefined = response.data?.data;

  if (!createdStory || typeof createdStory._id !== 'string') {
    throw new Error('Failed to create story: invalid server response');
  }

  return { id: createdStory._id };
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await authenticatedApiClient.get('/categories');

  const rawCategories: unknown = response.data?.data;

  if (!Array.isArray(rawCategories)) {
    return [];
  }

  return (rawCategories as RawCategory[]).map(category => ({
    id: category._id,
    name: category.name,
  }));
}
