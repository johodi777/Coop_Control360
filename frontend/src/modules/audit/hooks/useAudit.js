import { useState, useEffect } from "react";
import { auditAPI } from "../../../api/audit";

export function useAudit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAuditLogs = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditAPI.getAll(params);
      
      // El backend devuelve array directo o { data: [...] }
      if (Array.isArray(response)) {
        setAuditLogs(response);
      } else if (response.data) {
        setAuditLogs(response.data);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar auditoría");
      console.error("Error cargando auditoría:", err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getByUser = async (userId) => {
    try {
      const response = await auditAPI.getByUser(userId);
      return Array.isArray(response) ? response : response.data || [];
    } catch (err) {
      console.error("Error obteniendo auditoría por usuario:", err);
      return [];
    }
  };

  const getByAction = async (action) => {
    try {
      const response = await auditAPI.getByAction(action);
      return Array.isArray(response) ? response : response.data || [];
    } catch (err) {
      console.error("Error obteniendo auditoría por acción:", err);
      return [];
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return {
    auditLogs,
    loading,
    error,
    loadAuditLogs,
    getByUser,
    getByAction,
  };
}

