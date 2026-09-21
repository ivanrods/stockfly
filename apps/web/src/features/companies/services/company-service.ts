import apiClient from '@/shared/api/http-client';
import type { Company, UpdateCompanyRequest } from '../types/company-types';

export async function getMyCompany(): Promise<Company> {
  const response = await apiClient.get<Company>('/companies/me');
  return response.data;
}

export async function updateCompany(id: string, data: UpdateCompanyRequest): Promise<Company> {
  const response = await apiClient.put<Company>(`/companies/${id}`, data);
  return response.data;
}