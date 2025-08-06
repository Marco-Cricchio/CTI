// client/src/services/api.ts
import axios from 'axios';
import { Indicator, ApiResponse, DashboardStats, Tag } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API service functions
export const indicatorService = {
  // Get all indicators with pagination and filters
  getAll: async (params: {
    page?: number;
    limit?: number;
    type?: string;
    threat_level?: string;
  }): Promise<ApiResponse<Indicator[]>> => {
    const response = await api.get('/indicators', { params });
    return response.data;
  },

  // Get single indicator by ID
  getById: async (id: string): Promise<Indicator> => {
    const response = await api.get(`/indicators/${id}`);
    return response.data;
  },

  // Create new indicator
  create: async (indicator: Partial<Indicator>): Promise<Indicator> => {
    const response = await api.post('/indicators', indicator);
    return response.data;
  },

  // Update indicator
  update: async (id: string, indicator: Partial<Indicator>): Promise<Indicator> => {
    const response = await api.patch(`/indicators/${id}`, indicator);
    return response.data;
  },

  // Delete indicator
  delete: async (id: string): Promise<void> => {
    await api.delete(`/indicators/${id}`);
  },

  // Get dashboard stats
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/indicators/stats');
    return response.data;
  },
};

// Tag service functions
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/tags');
  return response.data;
};

export const createTag = async (name: string): Promise<Tag> => {
  const response = await api.post('/tags', { name });
  return response.data;
};

export const updateIndicatorTags = async (indicatorId: string, tagIds: string[]): Promise<Indicator> => {
  const response = await api.post(`/indicators/${indicatorId}/tags`, { tagIds });
  return response.data;
};

export const apiClient = api;
export default api;