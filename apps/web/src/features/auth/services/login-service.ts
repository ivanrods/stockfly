import apiClient from '@/shared/api/http-client';
import type { LoginRequest, LoginResponse } from '../types/login-types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}
