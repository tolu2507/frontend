import { brand } from '@/config/brand';

const API_URL = brand.apiUrl;

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    // If body is FormData, don't set Content-Type so browser sets boundary automatically
    const isFormData = options.body instanceof FormData;
    const headers: any = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  },

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    });
  },

  async patch(endpoint: string, data: any, options: RequestInit = {}) {
    return this.fetch(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    });
  },

  async get(endpoint: string) {
    return this.fetch(endpoint, {
      method: 'GET',
    });
  }
};
