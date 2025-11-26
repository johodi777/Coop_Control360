import { useState } from "react";
import { pqrsAPI } from "../../../api/pqrs";
import Button from "../../../components/ui/Button";
import { X } from "lucide-react";

export default function PqrsResponseForm({ pqrs, onClose }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      setError("La respuesta no puede estar vacía");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await pqrsAPI.respond(pqrs.id, response);

      if (result.success !== false) {
        onClose();
      } else {
        setError(result.message || "Error al responder la PQRS");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al responder la PQRS");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      peticion: "Petición",
      queja: "Queja",
      reclamo: "Reclamo",
      sugerencia: "Sugerencia",
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-3xl border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Responder PQRS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-dark rounded-lg border border-panel/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">ID: {pqrs.id}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              pqrs.type === "peticion" ? "bg-blue-500/20 text-blue-400" :
              pqrs.type === "queja" ? "bg-yellow-500/20 text-yellow-400" :
              pqrs.type === "reclamo" ? "bg-red-500/20 text-red-400" :
              "bg-green-500/20 text-green-400"
            }`}>
              {getTypeLabel(pqrs.type)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{pqrs.subject || "Sin asunto"}</h3>
          <p className="text-gray-300 text-sm">{pqrs.description || "Sin descripción"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Respuesta *
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows="6"
              className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              required
              placeholder="Escribe tu respuesta a esta PQRS..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !response.trim()}>
              {loading ? "Enviando..." : "Enviar Respuesta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

