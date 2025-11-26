import api from './axios';

export const affiliatesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/affiliates', { params });
    // El backend devuelve { success: true, data: [...], pagination: {...} }
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/affiliates/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/affiliates', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/affiliates/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/affiliates/${id}`);
    return response.data;
  },

  importExcel: async (formData) => {
    const response = await api.post('/affiliates/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

