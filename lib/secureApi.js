// lib/secureApi.js
import storage from './storage';

class SecureApi {
  getCsrfToken() {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return value;
      }
    }
    return null;
  }

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add auth token if available
    const token = await storage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Always include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

export default new SecureApi();