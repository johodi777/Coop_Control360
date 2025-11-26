import { useState, useEffect } from "react";
import { pqrsAPI } from "../../../api/pqrs";

export function usePqrs() {
  const [pqrs, setPqrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPqrs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pqrsAPI.getAll();
      
      // Manejar diferentes formatos de respuesta
      if (response.success !== false) {
        setPqrs(response.data || []);
      } else if (Array.isArray(response)) {
        setPqrs(response);
      } else {
        setPqrs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar PQRS");
      console.error("Error cargando PQRS:", err);
      setPqrs([]);
    } finally {
      setLoading(false);
    }
  };

  const createPqrs = async (data) => {
    try {
      const response = await pqrsAPI.create(data);
      await loadPqrs();
      return { success: true, data: response.data || response };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al crear PQRS";
      return { success: false, error: errorMsg };
    }
  };

  const respondPqrs = async (id, response) => {
    try {
      const result = await pqrsAPI.respond(id, response);
      await loadPqrs();
      return { success: true, data: result.data || result };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al responder PQRS";
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    loadPqrs();
  }, []);

  return {
    pqrs,
    loading,
    error,
    loadPqrs,
    createPqrs,
    respondPqrs,
  };
}

