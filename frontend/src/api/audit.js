import api from './axios';

export const auditAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/audit', { params });
    // El backend devuelve array directo
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getById: async (id) => {
    try {
      // Implementar cuando haya endpoint
      return null;
    } catch (error) {
      return null;
    }
  },

  getByUser: async (userId) => {
    try {
      // Implementar cuando haya endpoint
      const all = await auditAPI.getAll();
      return all.filter(log => log.userId === userId);
    } catch (error) {
      return [];
    }
  },

  getByAction: async (action) => {
    try {
      // Implementar cuando haya endpoint
      const all = await auditAPI.getAll();
      return all.filter(log => log.action === action);
    } catch (error) {
      return [];
    }
  },
};

