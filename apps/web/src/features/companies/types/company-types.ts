export type CompanyStatus = 'active' | 'inactive';

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  status: CompanyStatus;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}