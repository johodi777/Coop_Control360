import { useState, useEffect } from "react";
import { affiliatesAPI } from "../../../api/affiliates";
import Table from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import AffiliateForm from "./AffiliateForm";
import PaymentSummary from "./PaymentSummary";
import ImportExcel from "./ImportExcel";
import { Plus, Search, Edit, Trash2, Eye, Filter, Users, DollarSign, Calendar, Upload, CheckCircle, AlertCircle, UserPlus, UserX, RefreshCw } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useAssistants } from "../../../hooks/useAssistants";

const PAYMENT_STATUSES = {
  paid: { label: "Pagó (Pendiente pagar planilla)", icon: CheckCircle, color: "green" },
  pending: { label: "Falta por pagar", icon: AlertCircle, color: "yellow" },
  paid_payroll: { label: "Planilla pagada", icon: CheckCircle, color: "blue" },
  retired: { label: "Retiro", icon: UserX, color: "red" },
  new: { label: "Nuevo", icon: UserPlus, color: "purple" },
};

export default function AffiliatesList() {
  const { assistants: ASSISTANTS } = useAssistants();
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAssistant, setFilterAssistant] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      // Cargar todos los afiliados para estadísticas y filtros
      // Usar un límite alto pero razonable (1000) para evitar problemas de rendimiento
      // Si hay más de 1000, se pueden agregar más páginas después
      let allAffiliates = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100; // Cargar en lotes de 100
      
      // Cargar todas las páginas
      while (hasMore && page <= 10) { // Máximo 10 páginas (1000 afiliados)
        const response = await affiliatesAPI.getAll({ limit: pageSize, page });
        
        if (response && response.data && Array.isArray(response.data)) {
          allAffiliates = [...allAffiliates, ...response.data];
          
          // Verificar si hay más páginas
          const total = response.pagination?.total || 0;
          const totalPages = response.pagination?.totalPages || 1;
          hasMore = page < totalPages && allAffiliates.length < total;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setAffiliates(allAffiliates);
      console.log(`✓ Cargados ${allAffiliates.length} afiliados`);
    } catch (error) {
      console.error("Error cargando afiliados:", error);
      console.error("Detalles del error:", error.response?.data);
      setAffiliates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (affiliate) => {
    if (!affiliate || !affiliate.id) {
      console.error("Afiliado inválido para editar:", affiliate);
      return;
    }
    setEditingAffiliate(affiliate);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingAffiliate(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const affiliate = affiliates.find(a => a.id === id);
    const name = affiliate ? `${affiliate.firstName} ${affiliate.lastName}` : 'este afiliado';
    
    if (window.confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      try {
        setLoading(true);
        await affiliatesAPI.delete(id);
        await loadAffiliates();
      } catch (error) {
        console.error("Error eliminando afiliado:", error);
        const errorMsg = error.response?.data?.message || "Error al eliminar el afiliado";
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAffiliate(null);
    loadAffiliates();
  };

  const handleResetMonthlyPayments = async () => {
    if (!window.confirm('¿Estás seguro de resetear los estados de pago de todos los afiliados activos a "Falta por pagar"?\n\nEsta acción actualizará el estado de pago de todos los afiliados activos.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await affiliatesAPI.resetMonthlyPayments();
      
      if (response.success) {
        alert(`✅ ${response.message}\n\nSe actualizaron ${response.data?.updated || 0} afiliados.`);
        // Recargar afiliados para ver los cambios
        await loadAffiliates();
      } else {
        alert(`⚠️ ${response.message || 'No se pudo ejecutar el reset'}`);
      }
    } catch (error) {
      console.error("Error ejecutando reset mensual:", error);
      const errorMsg = error.response?.data?.message || "Error al ejecutar el reset mensual";
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };


  const getPaymentStatusInfo = (affiliate) => {
    // Si tiene paymentStatus, usarlo directamente
    if (affiliate.paymentStatus) {
      return PAYMENT_STATUSES[affiliate.paymentStatus] || PAYMENT_STATUSES.pending;
    }
    // Lógica por defecto basada en estado y fecha
    if (affiliate.status === "retirado") {
      return PAYMENT_STATUSES.retired;
    }
    // Verificar si es nuevo (afiliado en el último mes)
    const affiliationDate = new Date(affiliate.affiliationDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (affiliationDate > oneMonthAgo) {
      return PAYMENT_STATUSES.new;
    }
    return PAYMENT_STATUSES.pending;
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    const matchesSearch =
      `${affiliate.firstName} ${affiliate.lastName} ${affiliate.documentNumber} ${affiliate.businessName || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesAssistant =
      filterAssistant === "all" || affiliate.assistantId === filterAssistant;
    const matchesStatus = filterStatus === "all" || affiliate.status === filterStatus;
    
    const paymentStatusInfo = getPaymentStatusInfo(affiliate);
    const matchesPaymentStatus =
      filterPaymentStatus === "all" || 
      affiliate.paymentStatus === filterPaymentStatus ||
      (!affiliate.paymentStatus && filterPaymentStatus === "pending");

    return matchesSearch && matchesAssistant && matchesStatus && matchesPaymentStatus;
  });

  // Calcular estadísticas - usar el total real de afiliados, no los filtrados
  const stats = {
    total: affiliates.length, // Total real de todos los afiliados
    byAssistant: ASSISTANTS.reduce((acc, assistant) => {
      acc[assistant.id] = affiliates.filter((a) => a.assistantId === assistant.id).length;
      return acc;
    }, {}),
    byPaymentStatus: Object.keys(PAYMENT_STATUSES).reduce((acc, status) => {
      acc[status] = affiliates.filter((a) => {
        const info = getPaymentStatusInfo(a);
        return a.paymentStatus === status || (!a.paymentStatus && status === "pending");
      }).length;
      return acc;
    }, {}),
    totalPending: affiliates
      .filter((a) => {
        const info = getPaymentStatusInfo(a);
        return info === PAYMENT_STATUSES.pending;
      })
      .reduce((sum, a) => sum + (parseFloat(a.monthlyContribution) || 0), 0),
  };

  const tableHeaders = [
    "Estado Pago",
    "Nombre",
    "Auxiliar",
    "Documento",
    "Acciones",
  ];
  
  // Función para hacer las filas editables directamente en la tabla
  const handleQuickEdit = (field, affiliate, value) => {
    const updatedData = { ...affiliate, [field]: value };
    handleEdit(updatedData);
  };

  const renderRow = (affiliate, index) => {
    const paymentStatusInfo = getPaymentStatusInfo(affiliate);
    const assistant = ASSISTANTS.find((a) => a.id === affiliate.assistantId);
    const IconComponent = paymentStatusInfo.icon;

    return (
      <>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <IconComponent 
              size={18} 
              className={
                paymentStatusInfo.color === "green"
                  ? "text-green-400"
                  : paymentStatusInfo.color === "yellow"
                  ? "text-yellow-400"
                  : paymentStatusInfo.color === "blue"
                  ? "text-blue-400"
                  : paymentStatusInfo.color === "red"
                  ? "text-red-400"
                  : "text-purple-400"
              }
            />
            <span
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                paymentStatusInfo.color === "green"
                  ? "bg-green-500/20 text-green-400"
                  : paymentStatusInfo.color === "yellow"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : paymentStatusInfo.color === "blue"
                  ? "bg-blue-500/20 text-blue-400"
                  : paymentStatusInfo.color === "red"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-purple-500/20 text-purple-400"
              }`}
            >
              {paymentStatusInfo.label}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-white font-medium">
          <div className="min-w-[180px] max-w-[250px] truncate" title={`${affiliate.firstName} ${affiliate.lastName}`}>
            {affiliate.firstName} {affiliate.lastName}
          </div>
        </td>
        <td className="px-4 py-3">
          {assistant ? (
            <span
              className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                assistant.color === "blue"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {assistant.name}
            </span>
          ) : (
            <span className="text-xs text-gray-500">Sin asignar</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-300">
          <div className="whitespace-nowrap min-w-[160px]">
            {affiliate.documentType} {affiliate.documentNumber}
          </div>
        </td>
        <td 
          className="px-4 py-3 text-sm font-medium"
          style={{ 
            position: 'sticky', 
            right: 0, 
            backgroundColor: 'rgb(26, 26, 34)',
            zIndex: 10,
            minWidth: '160px',
            boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.8)',
            textAlign: 'center'
          }}
        >
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => handleEdit(affiliate)}
              className="text-primary hover:text-primary/80 transition p-2.5 rounded-lg hover:bg-primary/20 flex-shrink-0 border border-primary/40 hover:border-primary/80 hover:scale-110"
              title="Editar afiliado"
              aria-label="Editar afiliado"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={() => handleDelete(affiliate.id)}
              className="text-red-400 hover:text-red-300 transition p-2.5 rounded-lg hover:bg-red-500/20 flex-shrink-0 border border-red-400/40 hover:border-red-400/80 hover:scale-110"
              title="Eliminar afiliado"
              aria-label="Eliminar afiliado"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </td>
      </>
    );
  };

  return (
    <div className="text-white w-full max-w-full overflow-x-visible">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestión de Afiliados</h1>
          <p className="text-sm sm:text-base text-gray-400">Administra los afiliados y control de pagos por auxiliar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setShowImportExcel(true)} className="text-xs sm:text-sm">
            <Upload size={18} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          <Button variant="secondary" onClick={() => setShowPaymentSummary(true)} className="text-xs sm:text-sm">
            <DollarSign size={18} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Resumen de Pagos</span>
            <span className="sm:hidden">Resumen</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleResetMonthlyPayments} 
            className="text-xs sm:text-sm"
            disabled={loading}
            title="Resetear estados de pago a 'Falta por pagar'"
          >
            <RefreshCw size={18} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Reset Mensual</span>
            <span className="sm:hidden">Reset</span>
          </Button>
          <Button onClick={handleNew} className="text-xs sm:text-sm">
            <Plus size={18} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Afiliado</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">Total Afiliados</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="text-primary flex-shrink-0 ml-2" size={20} />
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">Natalia</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.byAssistant.natalia || 0}</p>
            </div>
            <Users className="text-blue-400 flex-shrink-0 ml-2" size={20} />
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">Lina</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.byAssistant.lina || 0}</p>
            </div>
            <Users className="text-green-400 flex-shrink-0 ml-2" size={20} />
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-400 text-xs sm:text-sm mb-1 truncate">Pendiente por Pagar</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-400 truncate">
                {formatCurrency(stats.totalPending)}
              </p>
            </div>
            <DollarSign className="text-yellow-400 flex-shrink-0 ml-2" size={20} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-visible">
        <div className="p-4 sm:p-6 mb-0 space-y-3">
          {/* Búsqueda */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, documento o razón social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          
          {/* Filtros y contador */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="text-gray-400 flex-shrink-0" size={18} />
              <select
                value={filterAssistant}
                onChange={(e) => setFilterAssistant(e.target.value)}
                className="px-3 py-2 text-sm bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition min-w-[150px]"
              >
                <option value="all">Todos los auxiliares</option>
                {ASSISTANTS.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition min-w-[180px]"
              >
                <option value="all">Todos los estados de pago</option>
                {Object.entries(PAYMENT_STATUSES).map(([key, status]) => (
                  <option key={key} value={key}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition min-w-[140px]"
              >
                <option value="all">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="moroso">Moroso</option>
                <option value="retirado">Retirado</option>
              </select>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 ml-auto">
              {filteredAffiliates.length} de {affiliates.length} afiliado(s)
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando afiliados...</div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-t border-panel/50">
            No se encontraron afiliados con los filtros seleccionados
          </div>
        ) : (
          <div className="w-full border-t border-panel/50 overflow-visible">
            <Table 
              headers={tableHeaders} 
              data={filteredAffiliates} 
              renderRow={renderRow}
              stickyActions={true}
            />
          </div>
        )}
      </Card>

      {showForm && (
        <AffiliateForm affiliate={editingAffiliate} onClose={handleFormClose} />
      )}
      {showPaymentSummary && (
        <PaymentSummary
          affiliates={affiliates}
          assistants={ASSISTANTS}
          onClose={() => setShowPaymentSummary(false)}
        />
      )}
      {showImportExcel && (
        <ImportExcel
          onClose={() => setShowImportExcel(false)}
          onImportComplete={() => {
            setShowImportExcel(false);
            loadAffiliates();
          }}
        />
      )}
    </div>
  );
}
