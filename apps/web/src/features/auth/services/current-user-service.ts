import apiClient from '@/shared/api/http-client';
import type { User } from '../types/register-types';

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
}