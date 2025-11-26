import { useState, useEffect } from "react";
import { affiliatesAPI } from "../../../api/affiliates";

export function useAffiliates() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await affiliatesAPI.getAll();
      setAffiliates(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar afiliados");
      console.error("Error cargando afiliados:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAffiliate = async (data) => {
    try {
      const response = await affiliatesAPI.create(data);
      await loadAffiliates();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al crear afiliado";
      return { success: false, error: errorMsg };
    }
  };

  const updateAffiliate = async (id, data) => {
    try {
      const response = await affiliatesAPI.update(id, data);
      await loadAffiliates();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al actualizar afiliado";
      return { success: false, error: errorMsg };
    }
  };

  const deleteAffiliate = async (id) => {
    try {
      await affiliatesAPI.delete(id);
      await loadAffiliates();
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al eliminar afiliado";
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    loadAffiliates();
  }, []);

  return {
    affiliates,
    loading,
    error,
    loadAffiliates,
    createAffiliate,
    updateAffiliate,
    deleteAffiliate,
  };
}

