import { useState, useMemo } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { X, DollarSign, Users, Calendar, Download, CheckCircle, AlertCircle, Clock, UserPlus, UserX } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

const PAYMENT_STATUSES = {
  paid: { label: "Pagó (Pendiente pagar planilla)", icon: CheckCircle, color: "green" },
  pending: { label: "Falta por pagar", icon: AlertCircle, color: "yellow" },
  paid_payroll: { label: "Planilla pagada", icon: CheckCircle, color: "blue" },
  retired: { label: "Retiro", icon: UserX, color: "red" },
  new: { label: "Nuevo", icon: UserPlus, color: "purple" },
};

export default function PaymentSummary({ affiliates, assistants, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const getPaymentStatusInfo = (affiliate) => {
    if (affiliate.paymentStatus) {
      return PAYMENT_STATUSES[affiliate.paymentStatus] || PAYMENT_STATUSES.pending;
    }
    if (affiliate.status === "retirado") {
      return PAYMENT_STATUSES.retired;
    }
    const affiliationDate = new Date(affiliate.affiliationDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (affiliationDate > oneMonthAgo) {
      return PAYMENT_STATUSES.new;
    }
    return PAYMENT_STATUSES.pending;
  };

  const summary = useMemo(() => {
    const byAssistant = assistants.reduce((acc, assistant) => {
      const assistantAffiliates = affiliates.filter(
        (a) => a.assistantId === assistant.id
      );

      const paid = assistantAffiliates.filter(
        (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.paid
      );
      const pending = assistantAffiliates.filter(
        (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.pending
      );
      const paidPayroll = assistantAffiliates.filter(
        (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.paid_payroll
      );
      const retired = assistantAffiliates.filter(
        (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.retired
      );
      const newAffiliates = assistantAffiliates.filter(
        (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.new
      );

      const totalPaid = paid.reduce(
        (sum, a) => sum + (parseFloat(a.monthlyContribution) || 0),
        0
      );
      const totalPending = pending.reduce(
        (sum, a) => sum + (parseFloat(a.monthlyContribution) || 0),
        0
      );
      const totalPaidPayroll = paidPayroll.reduce(
        (sum, a) => sum + (parseFloat(a.monthlyContribution) || 0),
        0
      );

      acc[assistant.id] = {
        name: assistant.name,
        color: assistant.color,
        total: assistantAffiliates.length,
        paid: paid.length,
        pending: pending.length,
        paidPayroll: paidPayroll.length,
        retired: retired.length,
        new: newAffiliates.length,
        totalPaid,
        totalPending,
        totalPaidPayroll,
        affiliates: {
          paid,
          pending,
          paidPayroll,
          retired,
          new: newAffiliates,
        },
      };
      return acc;
    }, {});

    const allPending = affiliates.filter(
      (a) => getPaymentStatusInfo(a) === PAYMENT_STATUSES.pending
    );
    const totalPendingAmount = allPending.reduce(
      (sum, a) => sum + (parseFloat(a.monthlyContribution) || 0),
      0
    );

    return {
      byAssistant,
      totalPending: {
        count: allPending.length,
        amount: totalPendingAmount,
        affiliates: allPending,
      },
    };
  }, [affiliates, assistants]);


  const formatMonth = (monthString) => {
    const [year, month] = monthString.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("es-CO", { year: "numeric", month: "long" });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Resumen de Pagos</h2>
            <p className="text-gray-400 text-sm mt-1">
              {formatMonth(selectedMonth)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Exportar
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Resumen por Auxiliar */}
          {assistants.map((assistant) => {
            const data = summary.byAssistant[assistant.id];
            if (!data) return null;

            return (
              <Card
                key={assistant.id}
                className={`border-2 ${
                  assistant.color === "blue"
                    ? "border-blue-500/50"
                    : "border-green-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Pagó ({data.name})
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      assistant.color === "blue"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {data.total} afiliados
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Pagó (Pendiente pagar planilla)</p>
                    <p className="text-lg font-bold text-green-400">
                      {data.paid} ({formatCurrency(data.totalPaid)})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Planilla pagada</p>
                    <p className="text-lg font-bold text-blue-400">
                      {data.paidPayroll} ({formatCurrency(data.totalPaidPayroll)})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Falta por pagar</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {data.pending} ({formatCurrency(data.totalPending)})
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Nuevos</p>
                    <p className="text-lg font-bold text-purple-400">{data.new}</p>
                  </div>
                </div>

                {/* Lista de afiliados */}
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {data.affiliates.paid.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                    >
                      <span className="text-white">
                        {affiliate.firstName} {affiliate.lastName}
                      </span>
                      <span className="text-green-400 font-medium flex items-center gap-1">
                        {formatCurrency(affiliate.monthlyContribution)} <CheckCircle size={16} />
                      </span>
                    </div>
                  ))}
                  {data.affiliates.paidPayroll.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                    >
                      <span className="text-white">
                        {affiliate.firstName} {affiliate.lastName}
                      </span>
                      <span className="text-blue-400 font-medium flex items-center gap-1">
                        {formatCurrency(affiliate.monthlyContribution)} <CheckCircle size={16} />
                      </span>
                    </div>
                  ))}
                  {data.affiliates.pending.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                    >
                      <span className="text-white">
                        {affiliate.firstName} {affiliate.lastName}
                      </span>
                      <span className="text-yellow-400 font-medium flex items-center gap-1">
                        {formatCurrency(affiliate.monthlyContribution)} <AlertCircle size={16} />
                      </span>
                    </div>
                  ))}
                  {data.affiliates.new.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                    >
                      <span className="text-white">
                        {affiliate.firstName} {affiliate.lastName}
                      </span>
                      <span className="text-purple-400 font-medium flex items-center gap-1">
                        <UserPlus size={16} />
                      </span>
                    </div>
                  ))}
                  {data.affiliates.retired.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                    >
                      <span className="text-white">
                        {affiliate.firstName} {affiliate.lastName}
                      </span>
                      <span className="text-red-400 font-medium flex items-center gap-1">
                        <UserX size={16} />
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Resumen General */}
          <Card className="bg-yellow-500/10 border-yellow-500/50">
            <h3 className="text-xl font-bold text-white mb-4">
              Pendiente por Pagar Aporte
            </h3>
            <div className="mb-4">
              <p className="text-2xl font-bold text-yellow-400">
                {summary.totalPending.count} afiliados - {formatCurrency(summary.totalPending.amount)}
              </p>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {summary.totalPending.affiliates.map((affiliate) => (
                <div
                  key={affiliate.id}
                  className="flex items-center justify-between p-2 bg-dark/50 rounded text-sm"
                >
                  <span className="text-white">
                    {affiliate.firstName} {affiliate.lastName}
                  </span>
                  <span className="text-yellow-400 font-medium flex items-center gap-1">
                    {formatCurrency(affiliate.monthlyContribution)} <Clock size={16} />
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Totales */}
          <Card className="bg-primary/10 border-primary/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Pendiente</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(summary.totalPending.amount)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Retiros por Pagar</p>
                <p className="text-2xl font-bold text-white">$ 0</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Ingresos por Pagar</p>
                <p className="text-2xl font-bold text-white">$ 0</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

