import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Businesses API
export const businessesApi = {
  create: async (data: any) => {
    const response = await api.post('/businesses', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/businesses');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await api.get(`/businesses/${id}`);
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getListings: async () => {
    const response = await api.get('/admin/listings');
    return response.data;
  },
};