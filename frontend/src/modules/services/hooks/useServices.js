import { useState, useEffect } from "react";
import { servicesAPI } from "../../../api/services";

export function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await servicesAPI.getAll();
      setServices(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar servicios");
      console.error("Error cargando servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (data) => {
    try {
      const response = await servicesAPI.create(data);
      await loadServices();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al crear servicio";
      return { success: false, error: errorMsg };
    }
  };

  const updateService = async (id, data) => {
    try {
      const response = await servicesAPI.update(id, data);
      await loadServices();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al actualizar servicio";
      return { success: false, error: errorMsg };
    }
  };

  const deleteService = async (id) => {
    try {
      await servicesAPI.delete(id);
      await loadServices();
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al eliminar servicio";
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return {
    services,
    loading,
    error,
    loadServices,
    createService,
    updateService,
    deleteService,
  };
}

