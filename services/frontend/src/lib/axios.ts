import axios, { AxiosError } from 'axios';
import { getCookie, setCookie } from '@/utils/cookies';

// Create AXIOS instance pointing to our unified API Gateway/Proxy endpoint
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Crucial for HTTP-only cookies transmission
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to attach Authorization header on every request
api.interceptors.request.use((config) => {
  const token = getCookie('access_token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Response Interceptor for Token Rotation (RTR)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If API returns 401 Unauthorized (expired access token)
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      // Do not attempt to refresh token if the failed request was a login attempt
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie('refresh_token');
        if (!refreshToken) {
           throw new Error('No refresh token available');
        }

        // Refresh token endpoint returns the new access token
        const { data } = await axios.post(
          '/api/v1/auth/refresh',
          { refresh_token: refreshToken },
          { withCredentials: true }
        );
        const newToken = data.access_token || data.accessToken;
        const newRefreshToken = data.refresh_token || refreshToken;
        
        // Save the new token in cookies so it persists across reloads!
        setCookie('access_token', newToken, 604800);
        setCookie('refresh_token', newRefreshToken, 2592000);

        // Store new token in global Axios config and re-attempt original request
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // If refresh fails, session is completely dead. Trigger client logout redirects.
        if (typeof window !== 'undefined') {
          // Clear cookies manually to avoid middleware redirect loop
          document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
