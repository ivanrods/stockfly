import axios from 'axios';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const message = (error.response.data as { message?: string })?.message ?? 'Erro desconhecido';
      throw new ApiError(message, error.response.status);
    }
    throw new ApiError('Erro de conexão com o servidor', 0);
  },
);

export default apiClient;
