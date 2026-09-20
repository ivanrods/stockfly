import type { UserRole } from '@/features/auth/types/register-types';

export interface DecodedJwtPayload {
  id: string;
  companyId: string | null;
  role: UserRole;
}

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const payload = JSON.parse(decodeBase64Url(segment)) as Partial<DecodedJwtPayload>;
    if (!payload.id) return null;

    return {
      id: payload.id,
      companyId: payload.companyId ?? null,
      role: payload.role ?? 'viewer',
    };
  } catch {
    return null;
  }
}