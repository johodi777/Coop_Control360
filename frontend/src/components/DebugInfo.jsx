// Componente temporal para debug - eliminar después
import { useEffect } from 'react';

export default function DebugInfo() {
  useEffect(() => {
    console.log('✅ React está funcionando');
    console.log('✅ DebugInfo se renderizó');
    console.log('Token:', localStorage.getItem('token'));
    console.log('Pathname:', window.location.pathname);
  }, []);

  return null;
}

