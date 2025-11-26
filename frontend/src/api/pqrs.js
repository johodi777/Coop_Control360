import api from './axios';

export const pqrsAPI = {
  getAll: async (params = {}) => {
    try {
      // El backend no tiene endpoint GET /pqrs, retornar array vacío por ahora
      // Esto se puede implementar cuando el backend lo agregue
      return { data: [], success: true };
    } catch (error) {
      console.error("Error obteniendo PQRS:", error);
      return { data: [], success: false };
    }
  },

  getById: async (id) => {
    try {
      // Implementar cuando haya endpoint
      return { data: null, success: false };
    } catch (error) {
      return { data: null, success: false };
    }
  },

  create: async (data) => {
    const response = await api.post('/pqrs', data);
    // El backend devuelve el objeto directamente o en { data: ... }
    return { data: response.data, success: true };
  },

  update: async (id, data) => {
    try {
      // Implementar cuando haya endpoint
      return { data: null, success: false };
    } catch (error) {
      return { data: null, success: false };
    }
  },

  respond: async (id, responseText) => {
    const response = await api.post('/pqrs/respond', { 
      pqrsId: id, 
      response: responseText 
    });
    // El backend devuelve el objeto directamente o en { data: ... }
    return { data: response.data, success: true };
  },
};

