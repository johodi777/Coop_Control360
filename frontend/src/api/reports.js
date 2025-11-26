import api from './axios';

export const reportsAPI = {
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getFinancial: async () => {
    const response = await api.get('/reports/financial');
    return response.data;
  },

  getAffiliates: async (params = {}) => {
    const response = await api.get('/reports/affiliates', { params });
    return response.data;
  },

  getServices: async (params = {}) => {
    const response = await api.get('/reports/services', { params });
    return response.data;
  },
};

