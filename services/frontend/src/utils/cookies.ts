// Utility functions to read and write client-side session cookies

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function deleteCookie(name: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}
