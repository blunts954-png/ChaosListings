import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export as apiClient for compatibility
export const apiClient = api;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    agencyName: string;
    agencySlug: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Agencies API
export const agenciesApi = {
  getAll: async () => {
    const response = await api.get('/agencies');
    return response.data;
  },

  getOne: async (agencyId: string) => {
    const response = await api.get(`/agencies/${agencyId}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/agencies', data);
    return response.data;
  },

  update: async (agencyId: string, data: any) => {
    const response = await api.patch(`/agencies/${agencyId}`, data);
    return response.data;
  },

  delete: async (agencyId: string) => {
    const response = await api.delete(`/agencies/${agencyId}`);
    return response.data;
  },

  // Team management
  getMembers: async (agencyId: string) => {
    const response = await api.get(`/agencies/${agencyId}/members`);
    return response.data;
  },

  inviteMember: async (agencyId: string, data: any) => {
    const response = await api.post(`/agencies/${agencyId}/members`, data);
    return response.data;
  },

  updateMember: async (agencyId: string, membershipId: string, data: any) => {
    const response = await api.patch(`/agencies/${agencyId}/members/${membershipId}`, data);
    return response.data;
  },

  removeMember: async (agencyId: string, membershipId: string) => {
    const response = await api.delete(`/agencies/${agencyId}/members/${membershipId}`);
    return response.data;
  },
};

// Businesses API
export const businessesApi = {
  getAll: async (agencyId: string, filters?: any) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/agencies/${agencyId}/businesses?${params}`);
    return response.data;
  },

  getOne: async (agencyId: string, businessId: string) => {
    const response = await api.get(`/agencies/${agencyId}/businesses/${businessId}`);
    return response.data;
  },

  create: async (agencyId: string, data: any) => {
    const response = await api.post(`/agencies/${agencyId}/businesses`, data);
    return response.data;
  },

  update: async (agencyId: string, businessId: string, data: any) => {
    const response = await api.patch(`/agencies/${agencyId}/businesses/${businessId}`, data);
    return response.data;
  },

  delete: async (agencyId: string, businessId: string) => {
    const response = await api.delete(`/agencies/${agencyId}/businesses/${businessId}`);
    return response.data;
  },
};

// Subscriptions API
export const subscriptionsApi = {
  getAll: async (agencyId: string) => {
    const response = await api.get(`/agencies/${agencyId}/subscriptions`);
    return response.data;
  },

  getOne: async (agencyId: string, subscriptionId: string) => {
    const response = await api.get(`/agencies/${agencyId}/subscriptions/${subscriptionId}`);
    return response.data;
  },

  create: async (agencyId: string, businessId: string, data: any) => {
    const response = await api.post(`/agencies/${agencyId}/subscriptions/businesses/${businessId}`, data);
    return response.data;
  },

  update: async (agencyId: string, subscriptionId: string, data: any) => {
    const response = await api.patch(`/agencies/${agencyId}/subscriptions/${subscriptionId}`, data);
    return response.data;
  },

  cancel: async (agencyId: string, subscriptionId: string, immediately: boolean = false) => {
    const response = await api.delete(`/agencies/${agencyId}/subscriptions/${subscriptionId}?immediately=${immediately}`);
    return response.data;
  },

  resume: async (agencyId: string, subscriptionId: string) => {
    const response = await api.post(`/agencies/${agencyId}/subscriptions/${subscriptionId}/resume`);
    return response.data;
  },

  getPrices: async (agencyId: string) => {
    const response = await api.get(`/agencies/${agencyId}/subscriptions/prices`);
    return response.data;
  },

  getInvoices: async (agencyId: string) => {
    const response = await api.get(`/agencies/${agencyId}/subscriptions/invoices`);
    return response.data;
  },

  createCheckoutSession: async (agencyId: string, businessId: string, data: any) => {
    const response = await api.post(`/agencies/${agencyId}/subscriptions/checkout/businesses/${businessId}`, data);
    return response.data;
  },

  createBillingPortal: async (agencyId: string, returnUrl: string) => {
    const response = await api.post(`/agencies/${agencyId}/subscriptions/billing-portal`, { returnUrl });
    return response.data;
  },
};

// Listings API
export const listingsApi = {
  getSummary: async (agencyId: string, businessId: string) => {
    const response = await api.get(`/agencies/${agencyId}/businesses/${businessId}/listings/summary`);
    return response.data;
  },

  getDirectories: async (agencyId: string, businessId: string) => {
    const response = await api.get(`/agencies/${agencyId}/businesses/${businessId}/listings/directories`);
    return response.data;
  },

  activate: async (agencyId: string, businessId: string) => {
    const response = await api.post(`/agencies/${agencyId}/businesses/${businessId}/listings/activate`);
    return response.data;
  },

  sync: async (agencyId: string, businessId: string) => {
    const response = await api.post(`/agencies/${agencyId}/businesses/${businessId}/listings/sync`);
    return response.data;
  },
};

// Jobs API
export const jobsApi = {
    // ... (existing jobsApi methods)
};

// Admin API
export const adminApi = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },
};

export default api;