import api from './axios';

export const paymentsAPI = {
  // Obtener todas las transacciones
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/payments/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo pagos:', error);
      return { data: [], success: false };
    }
  },

  // Crear transacción (pago)
  create: async (data) => {
    const response = await api.post('/payments/transactions', data);
    return response.data;
  },

  // Obtener transacción por ID
  getTransaction: async (id) => {
    const response = await api.get(`/payments/transactions/${id}`);
    return response.data;
  },

  // Crear factura
  createInvoice: async (data) => {
    const response = await api.post('/payments/invoices', data);
    return response.data;
  },

  getById: async (id) => {
    // Implementar cuando haya endpoint
    return { data: null, success: false };
  },

  update: async (id, data) => {
    // Implementar cuando haya endpoint
    return { data: null, success: false };
  },

  getByAffiliate: async (affiliateId) => {
    // Implementar cuando haya endpoint
    return { data: [], success: false };
  },
};

