import api from './axios';

// Timeout helper
const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: La solicitud tardó demasiado')), ms)
    )
  ]);
};

export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      // Ignorar errores de logout (puede que el token ya esté inválido)
      return { success: true };
    }
  },

  getCurrentUser: async () => {
    // Agregar timeout de 5 segundos
    const response = await withTimeout(api.get('/auth/me'), 5000);
    return response.data;
  },
};

