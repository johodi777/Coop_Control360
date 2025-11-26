import { useState, useEffect } from "react";
import { servicesAPI } from "../../../api/services";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PlanPricingForm from "./PlanPricingForm";
import { Edit, DollarSign, Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

const PLANS = [
  {
    id: "plan_vital",
    code: "PV",
    name: "Plan Vital",
    description: "EPS + ARL (Riesgo 1 al 5)",
    benefits: ["EPS", "ARL Riesgo 1-5"],
    color: "blue",
  },
  {
    id: "plan_basico",
    code: "PB",
    name: "Plan Básico",
    description: "EPS + ARL + Caja de Compensación",
    benefits: ["EPS", "ARL Riesgo 1-5", "Caja de Compensación"],
    color: "green",
  },
  {
    id: "plan_complementario",
    code: "PC",
    name: "Plan Complementario",
    description: "EPS + ARL + Pensión",
    benefits: ["EPS", "ARL Riesgo 1-5", "Pensión"],
    color: "purple",
  },
  {
    id: "plan_integral",
    code: "PI",
    name: "Plan Integral",
    description: "EPS + ARL + Caja + Pensión",
    benefits: ["EPS", "ARL Riesgo 1-5", "Caja de Compensación", "Pensión"],
    color: "orange",
  },
];

export default function ServicesList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getAll();
      
      let servicesData = [];
      if (response.success !== false) {
        servicesData = response.data || [];
      } else if (Array.isArray(response)) {
        servicesData = response;
      }

      // Mapear los servicios del backend a los planes
      const plansWithData = PLANS.map((plan) => {
        const serviceData = servicesData.find((s) => s.code === plan.code || s.name === plan.name);
        // Parsear pricing si viene como string
        let pricing = {};
        if (serviceData?.pricing) {
          pricing = typeof serviceData.pricing === 'string' 
            ? JSON.parse(serviceData.pricing) 
            : serviceData.pricing;
        } else if (serviceData?.pricingData) {
          pricing = typeof serviceData.pricingData === 'string'
            ? JSON.parse(serviceData.pricingData)
            : serviceData.pricingData;
        }
        return {
          ...plan,
          ...serviceData,
          id: serviceData?.id || plan.id,
          pricing: pricing,
        };
      });

      setPlans(plansWithData);
    } catch (error) {
      console.error("Error cargando planes:", error);
      setPlans(PLANS);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPricing = (plan) => {
    setSelectedPlan(plan);
    setShowPricingForm(true);
  };

  const handleFormClose = () => {
    setShowPricingForm(false);
    setSelectedPlan(null);
    loadPlans();
  };


  const getPlanColorClasses = (color) => {
    // Estilo uniforme para todos los planes con un toque sutil de color
    const colors = {
      blue: "border-panel/50 bg-panel/30 hover:border-blue-500/30",
      green: "border-panel/50 bg-panel/30 hover:border-green-500/30",
      purple: "border-panel/50 bg-panel/30 hover:border-purple-500/30",
      orange: "border-panel/50 bg-panel/30 hover:border-orange-500/30",
    };
    return colors[color] || "border-panel/50 bg-panel/30";
  };

  const getPlanPriceRange = (plan) => {
    // Obtener el rango de precios del año actual
    if (!plan.pricing || !plan.pricing[currentYear]) {
      return { min: null, max: null };
    }
    const prices = Object.values(plan.pricing[currentYear]).filter((p) => p);
    if (prices.length === 0) return { min: null, max: null };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planes de Servicios</h1>
          <p className="text-gray-400">Gestiona los planes y precios por riesgo ARL</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando planes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const priceRange = getPlanPriceRange(plan);
            return (
              <Card
                key={plan.id}
                className={`${getPlanColorClasses(plan.color)} border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex flex-col h-full`}
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <span className="text-xs px-2 py-1 bg-panel/50 rounded text-gray-400">
                          {plan.code}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4 min-h-[80px]">
                    <p className="text-sm text-gray-300 mb-2 font-medium">Beneficios incluidos:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-panel/50 text-gray-300"
                        >
                          <CheckCircle size={12} />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-dark/50 rounded-lg min-h-[120px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Precios {currentYear}</span>
                      <DollarSign size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      {priceRange.min && priceRange.max ? (
                        <div>
                          <p className="text-lg font-bold text-white mb-1">
                            {formatCurrency(priceRange.min)}
                          </p>
                          <p className="text-xs text-gray-400 mb-1">
                            Rango: {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                          </p>
                          <p className="text-xs text-gray-500">
                            (Según riesgo ARL 1-5)
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-yellow-400">Precios no configurados</p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleEditPricing(plan)}
                  variant="outline"
                  className="w-full mt-auto"
                >
                  <Edit size={18} className="mr-2" />
                  Configurar Precios
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {showPricingForm && selectedPlan && (
        <PlanPricingForm plan={selectedPlan} year={currentYear} onClose={handleFormClose} />
      )}
    </div>
  );
}
