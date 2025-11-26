import { useState, useEffect } from "react";
import StatsBox from "../components/ui/StatsBox";
import BarChart from "../components/charts/BarChart";
import Card from "../components/ui/Card";
import { Users, DollarSign, HelpCircle, FileCheck } from "lucide-react";
import { reportsAPI } from "../api/reports";
import { formatCurrency } from "../utils/formatCurrency";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    affiliates: { total: 0, active: 0 },
    financial: { monthPaid: 0, totalPaid: 0 },
    services: { pending: 0, approved: 0 },
    pqrs: { open: 0 },
    contributionsTrend: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboard();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyDashboard = (amount) => {
    if (!amount || amount === 0) return "$ 0";
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : parseFloat(amount);
    if (isNaN(numAmount)) return "$ 0";
    
    // Para el dashboard, usar formato abreviado si es muy grande
    const millions = numAmount / 1000000;
    if (millions >= 1) {
      return `$ ${millions.toFixed(1).replace('.', ',')}M`;
    }
    
    // Usar la función de utilidad para formato estándar
    return formatCurrency(numAmount);
  };

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Resumen general de la cooperativa</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-panel border border-panel/50 rounded-lg hover:bg-panel/80 transition text-sm"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando datos...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsBox
              title="Afiliados activos"
              value={stats.affiliates?.active?.toLocaleString() || "0"}
              icon={<Users size={24} />}
            />
            <StatsBox
              title="Aportes del mes"
              value={formatCurrencyDashboard(stats.financial?.monthPaid || 0)}
              icon={<DollarSign size={24} />}
            />
            <StatsBox
              title="PQRS abiertas"
              value={stats.pqrs?.open?.toString() || "0"}
              icon={<HelpCircle size={24} />}
            />
            <StatsBox
              title="Solicitudes pendientes"
              value={stats.services?.pending?.toString() || "0"}
              icon={<FileCheck size={24} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-xl mb-4 text-white">Tendencia de aportes (últimos 6 meses)</h2>
              {stats.contributionsTrend && stats.contributionsTrend.length > 0 ? (
                <BarChart data={stats.contributionsTrend} />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No hay datos de aportes disponibles
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-xl mb-4 text-white">Resumen de actividades</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                  <span className="text-gray-300">Total de afiliados</span>
                  <span className="text-white font-semibold">
                    {stats.affiliates?.total || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                  <span className="text-gray-300">Total pagado</span>
                  <span className="text-white font-semibold">
                    {formatCurrencyDashboard(stats.financial?.totalPaid || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-panel/50 rounded-lg">
                  <span className="text-gray-300">Servicios aprobados</span>
                  <span className="text-white font-semibold">
                    {stats.services?.approved || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

