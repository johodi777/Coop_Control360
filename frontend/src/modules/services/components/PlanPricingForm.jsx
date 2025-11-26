import { useState, useEffect } from "react";
import { servicesAPI } from "../../../api/services";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { X, DollarSign, Calendar, Save, Info } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

const ARL_RISKS = [
  { level: 1, label: "Riesgo I", description: "Oficina, Comercial" },
  { level: 2, label: "Riesgo II", description: "Comercio, Servicios" },
  { level: 3, label: "Riesgo III", description: "Industria, Construcción" },
  { level: 4, label: "Riesgo IV", description: "Minería, Petróleo" },
  { level: 5, label: "Riesgo V", description: "Alto Riesgo" },
];

export default function PlanPricingForm({ plan, year, onClose }) {
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(year);
  const [historicalPricing, setHistoricalPricing] = useState({});

  useEffect(() => {
    loadPricing();
  }, [plan, selectedYear]);

  const loadPricing = async () => {
    try {
      // Buscar el servicio por código
      const response = await servicesAPI.getByCode(plan.code);
      if (response.success && response.data) {
        const serviceData = response.data;
        // El pricing puede estar en pricing o en un campo JSON
        const pricingData = serviceData.pricing || 
                           (typeof serviceData.pricingData === 'string' ? JSON.parse(serviceData.pricingData) : serviceData.pricingData) ||
                           {};
        setHistoricalPricing(pricingData);
        setPricing(pricingData[selectedYear] || {});
      } else {
        // Si no existe, inicializar con estructura vacía
        setPricing({});
        setHistoricalPricing({});
      }
    } catch (error) {
      console.error("Error cargando precios:", error);
      // Si hay error, intentar cargar desde plan si tiene datos
      if (plan.pricing) {
        setHistoricalPricing(plan.pricing);
        setPricing(plan.pricing[selectedYear] || {});
      } else {
        setPricing({});
        setHistoricalPricing({});
      }
    }
  };

  const handlePriceChange = (riskLevel, value) => {
    setPricing((prev) => ({
      ...prev,
      [riskLevel]: value ? parseFloat(value) : null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar que al menos un precio esté configurado
      const hasPrices = Object.values(pricing).some((p) => p && p > 0);
      if (!hasPrices) {
        setError("Debes configurar al menos un precio para un nivel de riesgo");
        setLoading(false);
        return;
      }

      // Preparar datos del servicio
      const updatedPricing = {
        ...historicalPricing,
        [selectedYear]: pricing,
      };

      const serviceData = {
        name: plan.name,
        code: plan.code,
        description: plan.description,
        category: "plan",
        pricing: updatedPricing,
        isActive: true,
        planType: plan.id,
        benefits: plan.benefits,
      };

      // Buscar si el servicio ya existe
      const existingService = await servicesAPI.getByCode(plan.code);
      
      let result;
      if (existingService.success && existingService.data) {
        // Actualizar servicio existente
        result = await servicesAPI.update(existingService.data.id, serviceData);
      } else {
        // Crear nuevo servicio
        result = await servicesAPI.create(serviceData);
      }

      if (result.success !== false) {
        onClose();
      } else {
        setError(result.error || result.message || "Error al guardar los precios");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar los precios");
    } finally {
      setLoading(false);
    }
  };


  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  const copyFromPreviousYear = () => {
    const previousYear = selectedYear - 1;
    if (historicalPricing[previousYear]) {
      setPricing(historicalPricing[previousYear]);
    } else {
      setError(`No hay precios configurados para el año ${previousYear}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Configurar Precios - {plan.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
          </div>
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
          <Card className="bg-dark/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Año de Vigencia
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setPricing(historicalPricing[parseInt(e.target.value)] || {});
                    }}
                    className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  >
                    {getYearOptions().map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {historicalPricing[selectedYear - 1] && (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyFromPreviousYear}
                      className="text-sm"
                    >
                      <Calendar size={16} className="mr-2" />
                      Copiar del año anterior
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400">
                <Info size={16} className="inline mr-1" />
                Los precios se ajustan según el salario mínimo
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Precios por Nivel de Riesgo ARL - {selectedYear}
            </h3>

            {ARL_RISKS.map((risk) => (
              <Card key={risk.level} className="bg-dark/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      {risk.label}
                    </label>
                    <p className="text-xs text-gray-500">{risk.description}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="relative">
                      <DollarSign
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                      <input
                        type="number"
                        value={pricing[risk.level] || ""}
                        onChange={(e) => handlePriceChange(risk.level, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full pl-10 pr-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                      />
                    </div>
                    {pricing[risk.level] && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatCurrency(pricing[risk.level])}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 mt-0.5" size={20} />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Nota importante:</p>
                <p>
                  Los precios deben actualizarse anualmente según el incremento del salario mínimo
                  en Colombia. Puedes copiar los precios del año anterior y ajustarlos según el
                  incremento correspondiente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-panel/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? "Guardando..." : "Guardar Precios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

