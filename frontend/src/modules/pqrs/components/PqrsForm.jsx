import { useState } from "react";
import { pqrsAPI } from "../../../api/pqrs";
import Button from "../../../components/ui/Button";
import { X } from "lucide-react";

export default function PqrsForm({ onClose }) {
  const [formData, setFormData] = useState({
    affiliateId: "",
    type: "peticion",
    subject: "",
    description: "",
    priority: "media",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await pqrsAPI.create({
        ...formData,
        affiliateId: parseInt(formData.affiliateId),
      });

      if (result.success !== false) {
        onClose();
      } else {
        setError(result.message || "Error al crear la PQRS");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la PQRS");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-2xl border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Nueva PQRS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Afiliado *
              </label>
              <input
                type="number"
                name="affiliateId"
                value={formData.affiliateId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              >
                <option value="peticion">Petición</option>
                <option value="queja">Queja</option>
                <option value="reclamo">Reclamo</option>
                <option value="sugerencia">Sugerencia</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asunto *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
                placeholder="Resumen breve de la PQRS"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
                placeholder="Describe detalladamente tu petición, queja, reclamo o sugerencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear PQRS"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

