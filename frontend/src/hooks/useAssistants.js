import { useState, useEffect } from "react";
import { settingsAPI } from "../api/settings";

export function useAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAssistants();
      if (response.success !== false && response.data) {
        setAssistants(response.data);
      } else {
        // Valores por defecto si no hay configuración
        setAssistants([
          { id: "natalia", name: "Natalia", color: "blue" },
          { id: "lina", name: "Lina", color: "green" },
        ]);
      }
    } catch (error) {
      console.error("Error cargando auxiliares:", error);
      // Valores por defecto en caso de error
      setAssistants([
        { id: "natalia", name: "Natalia", color: "blue" },
        { id: "lina", name: "Lina", color: "green" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { assistants, loading, reload: loadAssistants };
}

