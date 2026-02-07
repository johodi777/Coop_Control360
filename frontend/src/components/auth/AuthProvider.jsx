import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

/**
 * Componente que verifica la autenticación al iniciar la app
 * NO bloquea la UI - verifica en background
 */
export default function AuthProvider({ children }) {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      // Si estamos en login, no verificar (mostrar login inmediatamente)
      if (location.pathname === '/login') {
        return;
      }

      // Si no hay token, redirigir inmediatamente a login (sin esperar)
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted && location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
        return;
      }

      // Si hay token, verificar en background (no bloquear UI)
      try {
        // Timeout corto de 3 segundos
        const timeoutId = setTimeout(() => {
          if (isMounted && !isAuthenticated && location.pathname !== '/login') {
            // Si tarda mucho y no está autenticado, ir a login
            navigate('/login', { replace: true });
          }
        }, 3000);

        const isValid = await checkAuth();
        clearTimeout(timeoutId);
        
        if (isMounted) {
          // Si no está autenticado y no está en login, redirigir
          if (!isValid && location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.warn('Error en verificación de auth:', error);
        if (isMounted && location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    };

    // Ejecutar verificación en background (no bloquear)
    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, checkAuth, isAuthenticated]);

  // SIEMPRE mostrar children (no bloquear nunca)
  // La verificación se hace en background y redirige si es necesario
  return <>{children}</>;
}

