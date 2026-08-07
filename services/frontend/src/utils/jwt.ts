import { UserPayload } from '@/store/auth-store';

// Decodes a standard JWT access token on client-side environment
export function decodeJwt(token: string): UserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return {
      userId: payload.sub || payload.userId,
      id: payload.sub || payload.userId,
      role: payload.role,
      email: payload.email,
      phone: payload.phone,
      name: payload.name,
    };
  } catch (error) {
    console.error('JWT Decode failed:', error);
    return null;
  }
}
