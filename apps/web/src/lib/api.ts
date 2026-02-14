import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Optionally trigger wallet disconnect
      }
    }
    return Promise.reject(error);
  }
);

// Admin API functions
export interface CreateMarketDto {
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
  minBet: string;
  maxBet: string;
  feeRate?: string;
}

export interface UpdateMarketDto {
  name?: string;
  minBet?: string;
  maxBet?: string;
  feeRate?: string;
  isActive?: boolean;
}

export interface Market {
  id: string;
  symbol: string;
  name: string;
  category: 'crypto' | 'kospi';
  marketType: '15min' | 'daily';
  minBet: string;
  maxBet: string;
  feeRate: string;
  isActive: boolean;
}

export const adminApi = {
  createMarket: (data: CreateMarketDto) => api.post<Market>('/markets', data),
  updateMarket: (id: string, data: UpdateMarketDto) => api.put<Market>(`/markets/${id}`, data),
  toggleMarketActive: (id: string) => api.patch<Market>(`/markets/${id}/toggle-active`),
  getAllMarkets: () => api.get<Market[]>('/markets/admin/all'),
};
