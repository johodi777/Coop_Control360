import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "../components/layout/Layout";
import AuthProvider from "../components/auth/AuthProvider";
import useAuthStore from "../context/authStore";

import Dashboard from "../pages/Dashboard";
import Affiliates from "../pages/Affiliates";
import Payments from "../pages/Payments";
import Services from "../pages/Services";
import Pqrs from "../pages/Pqrs";
import Audit from "../pages/Audit";
import Settings from "../pages/Settings";
import Login from "../pages/Login";

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  const token = localStorage.getItem('token');
  
  // Si no hay token, redirigir inmediatamente
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Si hay token pero no está autenticado aún, permitir acceso
  // El AuthProvider manejará la redirección si el token es inválido
  // Esto evita la pantalla negra mientras se verifica
  return <Outlet />;
}

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWrapper />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/afiliados" element={<Affiliates />} />
              <Route path="/pagos" element={<Payments />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/pqrs" element={<Pqrs />} />
              <Route path="/auditoria" element={<Audit />} />
              <Route path="/configuracion" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

