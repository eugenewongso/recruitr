/**
 * Base API client configuration.
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Create configured Axios instance for API requests.
 * 
 * Note: Authentication interceptors can be added later when auth is implemented.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from Supabase local storage
    // Note: We need to import supabase from where it's initialized
    // Since we can't import from context easily here without circular deps if context uses API,
    // we'll rely on the fact that Supabase persists the session in localStorage.
    // Or better, we assume the supabase client handles this if we use it directly.
    
    // Ideally, we get the session:
    const { data } = await import('@/context/AuthContext').then(m => m.supabase.auth.getSession());
    
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // TODO: Redirect to login when auth is implemented
      console.warn('Unauthorized - authentication required');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

