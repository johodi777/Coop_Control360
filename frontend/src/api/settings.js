import api from './axios';

export const settingsAPI = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  getByKey: async (key) => {
    const response = await api.get(`/settings/key/${key}`);
    return response.data;
  },

  upsert: async (key, value, description = null, category = 'general') => {
    const response = await api.post('/settings', { key, value, description, category });
    return response.data;
  },

  update: async (key, value, description = null, category = 'general') => {
    const response = await api.put(`/settings/${key}`, { key, value, description, category });
    return response.data;
  },

  delete: async (key) => {
    const response = await api.delete(`/settings/${key}`);
    return response.data;
  },

  // Métodos específicos para auxiliares
  getAssistants: async () => {
    const response = await api.get('/settings/assistants');
    return response.data;
  },

  updateAssistants: async (assistants) => {
    const response = await api.put('/settings/assistants', { assistants });
    return response.data;
  },
};

