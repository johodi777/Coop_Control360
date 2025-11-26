import { useState, useEffect } from "react";
import { paymentsAPI } from "../../../api/payments";
import { affiliatesAPI } from "../../../api/affiliates";
import Button from "../../../components/ui/Button";
import { X, Search, User, Download, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function PaymentForm({ onClose }) {
  const [formData, setFormData] = useState({
    affiliateId: "",
    paymentMethod: "efectivo",
    amount: "",
    paymentGateway: "",
  });
  
  const [paymentCreated, setPaymentCreated] = useState(null);

  const [affiliates, setAffiliates] = useState([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(true);
  const [searchAffiliate, setSearchAffiliate] = useState("");
  const [showAffiliateDropdown, setShowAffiliateDropdown] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoadingAffiliates(true);
      const response = await affiliatesAPI.getAll({ limit: 1000, page: 1 });
      if (response.success !== false && response.data) {
        setAffiliates(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error cargando afiliados:", error);
      setAffiliates([]);
    } finally {
      setLoadingAffiliates(false);
    }
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    if (!searchAffiliate || searchAffiliate.trim() === '') {
      // Si no hay búsqueda, mostrar todos (limitados a los primeros)
      return true;
    }
    const search = searchAffiliate.toLowerCase().trim();
    const fullName = `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase();
    const document = `${affiliate.documentType} ${affiliate.documentNumber}`.toLowerCase();
    const id = affiliate.id?.toString().toLowerCase();
    return fullName.includes(search) || document.includes(search) || id.includes(search);
  }).slice(0, 10); // Limitar a 10 resultados para mejor rendimiento

  const handleSelectAffiliate = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setFormData((prev) => ({ ...prev, affiliateId: affiliate.id.toString() }));
    setSearchAffiliate(`${affiliate.firstName} ${affiliate.lastName} - ${affiliate.documentType} ${affiliate.documentNumber}`);
    setShowAffiliateDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.affiliateId) {
      setError("Por favor selecciona un afiliado");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const paymentData = {
        affiliateId: parseInt(formData.affiliateId),
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        paymentGateway: formData.paymentGateway || null,
      };

      const response = await paymentsAPI.create(paymentData);
      
      if (response.success !== false && response.data) {
        setPaymentCreated(response.data);
        // No cerrar el formulario, mostrar opción de descargar recibo
      } else {
        setError(response.message || "Error al registrar el pago");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      // No cerrar si se hace click en el input o en el dropdown
      if (!target.closest('.affiliate-search-container') && !target.closest('.affiliate-dropdown')) {
        setShowAffiliateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateReceipt = () => {
    if (!paymentCreated) return;

    const { Affiliate, Invoice } = paymentCreated;
    const affiliate = Affiliate;
    const invoice = Invoice;
    const formattedAmount = formatCurrency(paymentCreated.amount);

    // Crear contenido HTML del recibo
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Pago - ${paymentCreated.transactionNumber}</title>
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
            <span class="info-value">${paymentCreated.transactionNumber || paymentCreated.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Referencia de Pago:</span>
            <span class="info-value">${paymentCreated.reference}</span>
          </div>
          ${invoice ? `
          <div class="info-row">
            <span class="info-label">Número de Factura:</span>
            <span class="info-value">${invoice.invoiceNumber || invoice.id}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Fecha de Pago:</span>
            <span class="info-value">${new Date(paymentCreated.createdAt).toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value"><span class="status">${paymentCreated.status === 'exitoso' ? 'PAGADO' : paymentCreated.status.toUpperCase()}</span></span>
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
            <span class="info-value">${paymentCreated.paymentMethod.toUpperCase()}</span>
          </div>
          ${paymentCreated.paymentGateway ? `
          <div class="info-row">
            <span class="info-label">Pasarela:</span>
            <span class="info-value">${paymentCreated.paymentGateway}</span>
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

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Esperar a que cargue y luego imprimir/guardar como PDF
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAffiliateDropdown(false)}>
      <div className="bg-panel rounded-xl p-6 w-full max-w-2xl border border-panel/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Registrar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {paymentCreated ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} />
                <span className="font-semibold">Pago registrado exitosamente</span>
              </div>
              <div className="text-sm mt-2 space-y-1">
                <p><strong>Referencia:</strong> {paymentCreated.reference}</p>
                <p><strong>Número de Transacción:</strong> {paymentCreated.transactionNumber || paymentCreated.id}</p>
                {paymentCreated.Invoice && (
                  <p><strong>Número de Factura:</strong> {paymentCreated.Invoice.invoiceNumber || paymentCreated.Invoice.id}</p>
                )}
                <p><strong>Monto:</strong> {formatCurrency(paymentCreated.amount)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={generateReceipt} className="flex-1">
                <Download size={18} className="mr-2" />
                Descargar Recibo
              </Button>
              <Button variant="outline" onClick={() => { setPaymentCreated(null); onClose(); }} className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative affiliate-search-container">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Afiliado *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, documento o ID..."
                  value={searchAffiliate}
                  onChange={(e) => {
                    setSearchAffiliate(e.target.value);
                    setShowAffiliateDropdown(true);
                    if (!e.target.value) {
                      setSelectedAffiliate(null);
                      setFormData((prev) => ({ ...prev, affiliateId: "" }));
                    }
                  }}
                  onFocus={() => {
                    if (affiliates.length > 0) {
                      setShowAffiliateDropdown(true);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  required={!formData.affiliateId}
                />
                {selectedAffiliate && (
                  <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-primary" />
                      <span className="text-white font-medium">
                        ID: {selectedAffiliate.id} | {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {selectedAffiliate.documentType} {selectedAffiliate.documentNumber}
                    </div>
                  </div>
                )}
                {showAffiliateDropdown && !loadingAffiliates && filteredAffiliates.length > 0 && (
                  <div className="affiliate-dropdown absolute z-50 w-full mt-1 bg-panel border border-panel/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {!searchAffiliate && (
                      <div className="px-4 py-2 text-xs text-gray-400 border-b border-panel/30 bg-panel/50">
                        Recomendados (escribe para buscar)
                      </div>
                    )}
                    {filteredAffiliates.map((affiliate) => (
                      <button
                        key={affiliate.id}
                        type="button"
                        onClick={() => handleSelectAffiliate(affiliate)}
                        className="w-full text-left px-4 py-3 hover:bg-primary/20 transition flex items-center gap-3 border-b border-panel/30 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {affiliate.firstName} {affiliate.lastName}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {affiliate.id} | {affiliate.documentType} {affiliate.documentNumber}
                          </div>
                        </div>
                      </button>
                    ))}
                    {affiliates.length > 10 && !searchAffiliate && (
                      <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-panel/30 bg-panel/50">
                        Mostrando 10 de {affiliates.length} afiliados. Escribe para filtrar.
                      </div>
                    )}
                    {searchAffiliate && filteredAffiliates.length >= 10 && (
                      <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-panel/30">
                        Mostrando 10 resultados. Refina tu búsqueda para más resultados.
                      </div>
                    )}
                  </div>
                )}
                {showAffiliateDropdown && searchAffiliate && filteredAffiliates.length === 0 && !loadingAffiliates && (
                  <div className="absolute z-50 w-full mt-1 bg-panel border border-panel/50 rounded-lg shadow-lg p-4 text-center text-gray-400">
                    No se encontraron afiliados con "{searchAffiliate}"
                  </div>
                )}
                {loadingAffiliates && (
                  <div className="absolute z-50 w-full mt-1 bg-panel border border-panel/50 rounded-lg shadow-lg p-4 text-center text-gray-400">
                    Cargando afiliados...
                  </div>
                )}
              </div>
              {formData.affiliateId && (
                <input
                  type="hidden"
                  name="affiliateId"
                  value={formData.affiliateId}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Método de Pago *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="nequi">Nequi</option>
                <option value="daviplata">Daviplata</option>
                <option value="payu">PayU</option>
                <option value="mercadopago">MercadoPago</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monto *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pasarela de Pago
              </label>
              <input
                type="text"
                name="paymentGateway"
                value={formData.paymentGateway}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                placeholder="PayU, MercadoPago, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

