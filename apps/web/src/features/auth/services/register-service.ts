import apiClient from '@/shared/api/http-client';
import type { RegisterRequest, RegisterResponse } from '../types/register-types';

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
}
