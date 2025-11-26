import { useState, useEffect } from "react";
import { pqrsAPI } from "../../../api/pqrs";
import Table from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PqrsForm from "./PqrsForm";
import PqrsResponseForm from "./PqrsResponseForm";
import { Plus, Search, MessageSquare, Filter, Eye } from "lucide-react";

export default function PqrsList() {
  const [pqrs, setPqrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedPqrs, setSelectedPqrs] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadPqrs();
  }, []);

  const loadPqrs = async () => {
    try {
      setLoading(true);
      const response = await pqrsAPI.getAll();
      // Manejar diferentes formatos de respuesta
      if (response.success !== false) {
        setPqrs(response.data || []);
      } else if (Array.isArray(response)) {
        setPqrs(response);
      } else {
        setPqrs([]);
      }
    } catch (error) {
      console.error("Error cargando PQRS:", error);
      setPqrs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (pqrsItem) => {
    setSelectedPqrs(pqrsItem);
    setShowResponseForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setShowResponseForm(false);
    setSelectedPqrs(null);
    loadPqrs();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getTypeColor = (type) => {
    const colors = {
      peticion: "bg-blue-500/20 text-blue-400",
      queja: "bg-yellow-500/20 text-yellow-400",
      reclamo: "bg-red-500/20 text-red-400",
      sugerencia: "bg-green-500/20 text-green-400",
    };
    return colors[type] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusColor = (status) => {
    const colors = {
      abierto: "bg-yellow-500/20 text-yellow-400",
      en_proceso: "bg-blue-500/20 text-blue-400",
      resuelto: "bg-green-500/20 text-green-400",
      cerrado: "bg-gray-500/20 text-gray-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  const filteredPqrs = pqrs.filter((item) => {
    const matchesSearch =
      item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.affiliateId?.toString().includes(searchTerm);
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: filteredPqrs.length,
    abiertas: filteredPqrs.filter((p) => p.status === "abierto").length,
    enProceso: filteredPqrs.filter((p) => p.status === "en_proceso").length,
    resueltas: filteredPqrs.filter((p) => p.status === "resuelto").length,
  };

  const tableHeaders = ["ID", "Tipo", "Asunto", "Afiliado", "Fecha", "Estado", "Acciones"];

  const renderRow = (pqrsItem) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{pqrsItem.id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(pqrsItem.type)}`}>
          {getTypeLabel(pqrsItem.type)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
        {pqrsItem.subject || pqrsItem.description?.substring(0, 50) || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {pqrsItem.affiliateId || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDate(pqrsItem.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pqrsItem.status)}`}>
          {pqrsItem.status || "abierto"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRespond(pqrsItem)}
            className="text-primary hover:text-primary/80 transition"
            title="Responder"
          >
            <MessageSquare size={18} />
          </button>
        </div>
      </td>
    </>
  );

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">PQRS</h1>
          <p className="text-gray-400">Peticiones, Quejas, Reclamos y Sugerencias</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} className="mr-2" />
          Nueva PQRS
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Abiertas</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.abiertas}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">En Proceso</p>
              <p className="text-2xl font-bold text-blue-400">{stats.enProceso}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Resueltas</p>
              <p className="text-2xl font-bold text-green-400">{stats.resueltas}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por asunto o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            >
              <option value="all">Todos los tipos</option>
              <option value="peticion">Petición</option>
              <option value="queja">Queja</option>
              <option value="reclamo">Reclamo</option>
              <option value="sugerencia">Sugerencia</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            >
              <option value="all">Todos los estados</option>
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
          <div className="text-sm text-gray-400">
            {filteredPqrs.length} PQRS encontrada(s)
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando PQRS...</div>
        ) : (
          <Table headers={tableHeaders} data={filteredPqrs} renderRow={renderRow} />
        )}
      </Card>

      {showForm && <PqrsForm onClose={handleFormClose} />}
      {showResponseForm && selectedPqrs && (
        <PqrsResponseForm pqrs={selectedPqrs} onClose={handleFormClose} />
      )}
    </div>
  );
}

