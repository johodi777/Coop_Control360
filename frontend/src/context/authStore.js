import { create } from 'zustand';
import { authAPI } from '../api/auth';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false, // Iniciar como false, se validará después
  loading: false, // Iniciar como false para no bloquear UI
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

  // Verificar si el token es válido al iniciar la app
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    // Si no hay token, no está autenticado
    if (!token) {
      set({ 
        isAuthenticated: false, 
        loading: false,
        token: null,
        user: null
      });
      return false;
    }

    // Si hay token, verificar con el backend (con timeout)
    try {
      // Timeout de 5 segundos para evitar bloqueos
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const response = await Promise.race([
        authAPI.getCurrentUser(),
        timeoutPromise
      ]);
      
      const user = response.data?.user || response.user || response.data;
      
      if (user) {
        set({ 
          user, 
          token,
          isAuthenticated: true, 
          loading: false 
        });
        return true;
      } else {
        // Token inválido, limpiar
        localStorage.removeItem('token');
        set({ 
          isAuthenticated: false, 
          loading: false,
          token: null,
          user: null
        });
        return false;
      }
    } catch (error) {
      // Token inválido, expirado o timeout - limpiar
      console.warn('Error verificando autenticación:', error.message);
      localStorage.removeItem('token');
      set({ 
        isAuthenticated: false, 
        loading: false,
        token: null,
        user: null,
        error: null // No mostrar error en verificación inicial
      });
      return false;
    }
  },
}));

export default useAuthStore;

