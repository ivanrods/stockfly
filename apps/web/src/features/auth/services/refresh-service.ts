import apiClient from '@/shared/api/http-client';
import type { TokenPair } from '../types/auth-types';

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const response = await apiClient.post<TokenPair>('/auth/refresh', { refreshToken });
  return response.data;
}