import { useState, useEffect } from "react";
import { paymentsAPI } from "../../../api/payments";

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentsAPI.getAll();
      setPayments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar pagos");
      console.error("Error cargando pagos:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (data) => {
    try {
      const response = await paymentsAPI.create(data);
      await loadPayments();
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error al registrar pago";
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    loadPayments,
    createPayment,
  };
}

