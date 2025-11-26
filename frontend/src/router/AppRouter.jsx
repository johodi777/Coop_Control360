import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "../components/layout/Layout";
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
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
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
    </BrowserRouter>
  );
}

