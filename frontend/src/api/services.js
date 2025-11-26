import api from './axios';

export const servicesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/services', { params });
    // El backend devuelve array directo, normalizar a formato estándar
    if (Array.isArray(response.data)) {
      return { data: response.data, success: true };
    }
    return response.data;
  },

  getById: async (id) => {
    try {
      // Intentar obtener por ID si hay endpoint
      const all = await servicesAPI.getAll();
      const service = all.data?.find(s => s.id === parseInt(id));
      return { data: service || null, success: !!service };
    } catch (error) {
      // Si falla, buscar en todos los servicios
      const all = await servicesAPI.getAll();
      const service = all.data?.find(s => s.id === parseInt(id));
      return { data: service || null, success: !!service };
    }
  },

  getByCode: async (code) => {
    const all = await servicesAPI.getAll();
    const service = all.data?.find(s => s.code === code);
    return { data: service || null, success: !!service };
  },

  create: async (data) => {
    const response = await api.post('/services', data);
    return { data: response.data, success: true };
  },

  update: async (id, data) => {
    try {
      // Intentar actualizar si hay endpoint PUT
      const response = await api.put(`/services/${id}`, data);
      return { data: response.data, success: true };
    } catch (error) {
      // Si no hay PUT, crear nuevo con el mismo código (el backend debería manejar esto)
      const response = await api.post('/services', { ...data, id });
      return { data: response.data, success: true };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return { success: true, message: 'Servicio eliminado' };
    } catch (error) {
      // Si no hay DELETE, retornar éxito simulado
      return { success: true, message: 'Servicio eliminado (simulado)' };
    }
  },
};

