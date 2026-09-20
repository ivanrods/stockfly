import apiClient from '@/shared/api/http-client';
import type { Company } from '../types/company-types';

export async function getMyCompany(): Promise<Company> {
  const response = await apiClient.get<Company>('/companies/me');
  return response.data;
}