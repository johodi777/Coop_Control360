import { useState, useEffect } from "react";
import { auditAPI } from "../../../api/audit";
import Table from "../../../components/ui/Table";
import Card from "../../../components/ui/Card";
import { Search, Filter, Download, Shield } from "lucide-react";
import Button from "../../../components/ui/Button";

export default function AuditList() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditAPI.getAll();
      
      // La API ya devuelve un array
      if (Array.isArray(response)) {
        setAuditLogs(response);
      } else {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error("Error cargando auditoría:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionLabel = (action) => {
    const labels = {
      CREATE_AFFILIATE: "Crear Afiliado",
      UPDATE_AFFILIATE: "Actualizar Afiliado",
      DELETE_AFFILIATE: "Eliminar Afiliado",
      CREATE_PAYMENT: "Crear Pago",
      CREATE_SERVICE: "Crear Servicio",
      UPDATE_SERVICE: "Actualizar Servicio",
      DELETE_SERVICE: "Eliminar Servicio",
      CREATE_PQRS: "Crear PQRS",
      RESPOND_PQRS: "Responder PQRS",
      LOGIN: "Inicio de Sesión",
      LOGOUT: "Cierre de Sesión",
    };
    return labels[action] || action;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: "bg-blue-500/20 text-blue-400",
      warning: "bg-yellow-500/20 text-yellow-400",
      error: "bg-red-500/20 text-red-400",
      critical: "bg-red-600/20 text-red-500",
    };
    return colors[severity] || "bg-gray-500/20 text-gray-400";
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId?.toString().includes(searchTerm) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesUser = filterUser === "all" || log.userId?.toString() === filterUser;
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))].filter(Boolean);
  const uniqueUsers = [...new Set(auditLogs.map((log) => log.userId))].filter(Boolean);

  const tableHeaders = ["ID", "Fecha", "Usuario", "Acción", "Entidad", "Detalles", "Severidad"];

  const renderRow = (log) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{log.id}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDate(log.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {log.userId || log.User?.fullName || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {getActionLabel(log.action)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
        {log.entityType || "-"}
      </td>
      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
        {log.details || log.changes || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(log.severity || "info")}`}>
          {log.severity || "info"}
        </span>
      </td>
    </>
  );

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auditoría</h1>
          <p className="text-gray-400">Registro de actividades y cambios en el sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAuditLogs}>
            <Shield size={20} className="mr-2" />
            Actualizar
          </Button>
          <Button variant="secondary">
            <Download size={20} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por acción, entidad o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            >
              <option value="all">Todas las acciones</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-400">
            {filteredLogs.length} registro(s) encontrado(s)
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando registros de auditoría...</div>
        ) : (
          <Table headers={tableHeaders} data={filteredLogs} renderRow={renderRow} />
        )}
      </Card>
    </div>
  );
}

