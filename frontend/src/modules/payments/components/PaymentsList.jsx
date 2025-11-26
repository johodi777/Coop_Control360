import { useState, useEffect } from "react";
import { paymentsAPI } from "../../../api/payments";
import Table from "../../../components/ui/Table";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PaymentForm from "./PaymentForm";
import PaymentDetails from "./PaymentDetails";
import { Plus, Search, DollarSign, Filter, Eye } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getAll({ limit: 1000, page: 1 });
      // Manejar diferentes formatos de respuesta
      if (response.success !== false && response.data) {
        setPayments(Array.isArray(response.data) ? response.data : []);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    loadPayments();
  };


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredPayments = payments.filter((payment) => {
    const affiliateName = payment.Affiliate 
      ? `${payment.Affiliate.firstName} ${payment.Affiliate.lastName}`.toLowerCase()
      : '';
    const matchesSearch =
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.affiliateId?.toString().includes(searchTerm) ||
      affiliateName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const tableHeaders = ["ID", "Fecha", "Afiliado", "Monto", "Método", "Referencia", "Estado", "Acciones"];

  const renderRow = (payment) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
        {payment.transactionNumber || payment.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDate(payment.createdAt || payment.processedAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {payment.Affiliate 
          ? `${payment.Affiliate.firstName} ${payment.Affiliate.lastName}`
          : payment.affiliateId || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
        {formatCurrency(payment.amount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
        {payment.paymentMethod || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {payment.reference || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            payment.status === "exitoso"
              ? "bg-green-500/20 text-green-400"
              : payment.status === "procesando"
              ? "bg-yellow-500/20 text-yellow-400"
              : payment.status === "fallido"
              ? "bg-red-500/20 text-red-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {payment.status || "procesando"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button 
          onClick={() => {
            setSelectedPaymentId(payment.id);
            setShowDetails(true);
          }}
          className="text-primary hover:text-primary/80 transition flex items-center gap-2"
        >
          <Eye size={16} />
          Ver
        </button>
      </td>
    </>
  );

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pagos y Aportes</h1>
          <p className="text-gray-400">Gestiona los pagos y aportes de los afiliados</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} className="mr-2" />
          Registrar Pago
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total del Mes</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="text-primary" size={32} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pagos Procesados</p>
              <p className="text-2xl font-bold text-white">
                {filteredPayments.filter((p) => p.status === "exitoso").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 text-xl">✓</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-white">
                {filteredPayments.filter((p) => p.status === "procesando").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <span className="text-yellow-400 text-xl">⏳</span>
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
              placeholder="Buscar por referencia o afiliado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            >
              <option value="all">Todos</option>
              <option value="exitoso">Exitosos</option>
              <option value="procesando">Procesando</option>
              <option value="fallido">Fallidos</option>
            </select>
          </div>
          <div className="text-sm text-gray-400">
            {filteredPayments.length} pago(s) encontrado(s)
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando pagos...</div>
        ) : (
          <Table headers={tableHeaders} data={filteredPayments} renderRow={renderRow} />
        )}
      </Card>

      {showForm && <PaymentForm onClose={handleFormClose} />}
      {showDetails && selectedPaymentId && (
        <PaymentDetails 
          paymentId={selectedPaymentId} 
          onClose={() => {
            setShowDetails(false);
            setSelectedPaymentId(null);
          }} 
        />
      )}
    </div>
  );
}

