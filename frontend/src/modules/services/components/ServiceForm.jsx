import { useState, useEffect } from "react";
import { servicesAPI } from "../../../api/services";
import Button from "../../../components/ui/Button";
import { X } from "lucide-react";

export default function ServiceForm({ service, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "salud",
    requirements: "",
    maxAmount: "",
    isActive: true,
    requiresApproval: true,
    minAffiliationMonths: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        code: service.code || "",
        description: service.description || "",
        category: service.category || "salud",
        requirements: service.requirements || "",
        maxAmount: service.maxAmount || "",
        isActive: service.isActive !== undefined ? service.isActive : true,
        requiresApproval: service.requiresApproval !== undefined ? service.requiresApproval : true,
        minAffiliationMonths: service.minAffiliationMonths || 0,
      });
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = {
        ...formData,
        maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
        minAffiliationMonths: parseInt(formData.minAffiliationMonths),
      };

      const result = service
        ? await servicesAPI.update(service.id, data)
        : await servicesAPI.create(data);

      if (result.success !== false) {
        onClose();
      } else {
        setError(result.error || result.message || "Error al guardar el servicio");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {service ? "Editar Servicio" : "Nuevo Servicio"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                placeholder="Ej: AUX-FUN"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              >
                <option value="salud">Salud</option>
                <option value="auxilio">Auxilio</option>
                <option value="poliza">Póliza</option>
                <option value="funerario">Funerario</option>
                <option value="educativo">Educativo</option>
                <option value="recreativo">Recreativo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monto Máximo (COP)
              </label>
              <input
                type="number"
                name="maxAmount"
                value={formData.maxAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meses Mínimos de Afiliación
              </label>
              <input
                type="number"
                name="minAffiliationMonths"
                value={formData.minAffiliationMonths}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requisitos
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                placeholder="Ej: Mínimo 6 meses de afiliación"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary bg-dark border-panel/50 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-300">Servicio Activo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="requiresApproval"
                checked={formData.requiresApproval}
                onChange={handleChange}
                className="w-4 h-4 text-primary bg-dark border-panel/50 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-300">Requiere Aprobación</span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : service ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

