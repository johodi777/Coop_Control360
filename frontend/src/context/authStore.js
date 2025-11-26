import { create } from 'zustand';
import { authAPI } from '../api/auth';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      // El backend devuelve token y user en el nivel superior o en data
      const token = response.token || response.data?.token;
      const user = response.user || response.data?.user;
      
      if (!token || !user) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      localStorage.setItem('token', token);
      set({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false 
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      set({ 
        error: errorMessage,
        loading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      });
    }
  },

  setUser: (user) => set({ user }),
  
  clearError: () => set({ error: null }),
}));

export default useAuthStore;

