import { useState, useEffect } from "react";
import { paymentsAPI } from "../../../api/payments";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { X, Download, User, DollarSign, Calendar, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function PaymentDetails({ paymentId, onClose }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await paymentsAPI.getTransaction(paymentId);
      if (response.success !== false && response.data) {
        setPayment(response.data);
      } else {
        setError("No se pudo cargar la información del pago");
      }
    } catch (err) {
      console.error("Error cargando pago:", err);
      setError("Error al cargar la información del pago");
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!payment) return;

    const { Affiliate, Invoice } = payment;
    const affiliate = Affiliate;
    const invoice = Invoice;
    const formattedAmount = formatCurrency(payment.amount);

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Pago - ${payment.transactionNumber || payment.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4F46E5;
            margin: 0;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #666;
          }
          .info-value {
            color: #333;
          }
          .amount-section {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
          }
          .amount-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 32px;
            font-weight: bold;
            color: #4F46E5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            background: #10B981;
            color: white;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RECIBO DE PAGO</h1>
          <p>CoopControl 360</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Número de Transacción:</span>
            <span class="info-value">${payment.transactionNumber || payment.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Referencia de Pago:</span>
            <span class="info-value">${payment.reference}</span>
          </div>
          ${invoice ? `
          <div class="info-row">
            <span class="info-label">Número de Factura:</span>
            <span class="info-value">${invoice.invoiceNumber || invoice.id}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Fecha de Pago:</span>
            <span class="info-value">${new Date(payment.createdAt).toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value"><span class="status">${payment.status === 'exitoso' ? 'PAGADO' : payment.status.toUpperCase()}</span></span>
          </div>
        </div>

        <div class="info-section">
          <h3 style="color: #4F46E5; margin-bottom: 15px;">INFORMACIÓN DEL AFILIADO</h3>
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${affiliate.firstName} ${affiliate.lastName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Documento:</span>
            <span class="info-value">${affiliate.documentType} ${affiliate.documentNumber}</span>
          </div>
          ${affiliate.email ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${affiliate.email}</span>
          </div>
          ` : ''}
          ${affiliate.phone ? `
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${affiliate.phone}</span>
          </div>
          ` : ''}
        </div>

        <div class="info-section">
          <h3 style="color: #4F46E5; margin-bottom: 15px;">DETALLES DEL PAGO</h3>
          <div class="info-row">
            <span class="info-label">Método de Pago:</span>
            <span class="info-value">${payment.paymentMethod.toUpperCase()}</span>
          </div>
          ${payment.paymentGateway ? `
          <div class="info-row">
            <span class="info-label">Pasarela:</span>
            <span class="info-value">${payment.paymentGateway}</span>
          </div>
          ` : ''}
          ${invoice && invoice.concept ? `
          <div class="info-row">
            <span class="info-label">Concepto:</span>
            <span class="info-value">${invoice.concept}</span>
          </div>
          ` : ''}
        </div>

        <div class="amount-section">
          <div class="amount-label">MONTO PAGADO</div>
          <div class="amount-value">${formattedAmount}</div>
        </div>

        <div class="footer">
          <p>Este es un recibo generado automáticamente por CoopControl 360</p>
          <p>Fecha de generación: ${new Date().toLocaleString('es-CO')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const getStatusIcon = () => {
    switch (payment?.status) {
      case 'exitoso':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'procesando':
        return <Clock size={20} className="text-yellow-400" />;
      case 'fallido':
        return <AlertCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (payment?.status) {
      case 'exitoso':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'procesando':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'fallido':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-panel rounded-xl p-6 w-full max-w-2xl border border-panel/50">
          <div className="text-center py-12 text-gray-400">Cargando información del pago...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-panel rounded-xl p-6 w-full max-w-2xl border border-panel/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <Button onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  const { Affiliate, Invoice } = payment;
  const affiliate = Affiliate;
  const invoice = Invoice;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-panel rounded-xl p-6 w-full max-w-3xl border border-panel/50 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Detalles del Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Información de la Transacción */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <FileText size={24} className="text-primary" />
              <h3 className="text-xl font-bold text-white">Información de la Transacción</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Número de Transacción</p>
                <p className="text-white font-medium">{payment.transactionNumber || payment.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Referencia</p>
                <p className="text-white font-medium">{payment.reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Fecha de Pago</p>
                <p className="text-white font-medium">
                  {new Date(payment.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Estado</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="font-medium capitalize">{payment.status}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Información del Afiliado */}
          {affiliate && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <User size={24} className="text-primary" />
                <h3 className="text-xl font-bold text-white">Información del Afiliado</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Nombre Completo</p>
                  <p className="text-white font-medium">{affiliate.firstName} {affiliate.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Documento</p>
                  <p className="text-white font-medium">{affiliate.documentType} {affiliate.documentNumber}</p>
                </div>
                {affiliate.email && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="text-white font-medium">{affiliate.email}</p>
                  </div>
                )}
                {affiliate.phone && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Teléfono</p>
                    <p className="text-white font-medium">{affiliate.phone}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Detalles del Pago */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <DollarSign size={24} className="text-primary" />
              <h3 className="text-xl font-bold text-white">Detalles del Pago</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Método de Pago</p>
                <p className="text-white font-medium capitalize">{payment.paymentMethod}</p>
              </div>
              {payment.paymentGateway && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pasarela de Pago</p>
                  <p className="text-white font-medium">{payment.paymentGateway}</p>
                </div>
              )}
              {invoice && (
                <>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Número de Factura</p>
                    <p className="text-white font-medium">{invoice.invoiceNumber || invoice.id}</p>
                  </div>
                  {invoice.concept && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Concepto</p>
                      <p className="text-white font-medium">{invoice.concept}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Monto Pagado</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(payment.amount)}</p>
            </div>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Button onClick={generateReceipt} className="flex-1">
              <Download size={18} className="mr-2" />
              Descargar Recibo
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

