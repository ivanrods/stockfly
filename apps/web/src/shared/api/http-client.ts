import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/shared/auth/token-storage';
import { redirectToLogin } from '@/shared/auth/redirect';
import type { TokenPair } from '@/features/auth/types/auth-types';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
}> = [];

function resolvePendingQueue(accessToken: string) {
  pendingQueue.forEach(({ resolve }) => resolve(accessToken));
  pendingQueue = [];
}

function rejectPendingQueue(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

function buildRefreshUrl(originalUrl: string | undefined): string {
  if (originalUrl && /^https?:\/\//.test(originalUrl)) {
    return `${new URL(originalUrl).origin}/auth/refresh`;
  }
  return '/auth/refresh';
}

async function requestNewTokens(refreshUrl: string, refreshToken: string): Promise<TokenPair> {
  const response = await apiClient.post<TokenPair>(refreshUrl, { refreshToken });
  return response.data;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new ApiError('Erro de conexão com o servidor', 0);
    }

    const message = (error.response.data as { message?: string })?.message ?? 'Erro desconhecido';
    const original = error.config as RetryableConfig | undefined;

    const isAuthUrl = original?.url?.includes('/auth/') ?? false;

    if (error.response.status !== 401 || !original || original._retry || isAuthUrl) {
      throw new ApiError(message, error.response.status);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      redirectToLogin();
      throw new ApiError(message, 401);
    }

    original._retry = true;

    if (isRefreshing) {
      try {
        const newAccessToken = await new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        });
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        throw new ApiError('Sessão expirada, faça login novamente', 401);
      }
    }

    isRefreshing = true;

    try {
      const tokens = await requestNewTokens(buildRefreshUrl(original.url), refreshToken);
      setTokens(tokens);
      resolvePendingQueue(tokens.accessToken);

      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(original);
    } catch {
      rejectPendingQueue(error);
      clearTokens();
      redirectToLogin();
      throw new ApiError('Sessão expirada, faça login novamente', 401);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;