import { useState, useEffect } from "react";
import { affiliatesAPI } from "../../../api/affiliates";
import Button from "../../../components/ui/Button";
import { X } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";
import { useAssistants } from "../../../hooks/useAssistants";

export default function AffiliateForm({ affiliate, onClose }) {
  const { assistants } = useAssistants();
  const [formData, setFormData] = useState({
    cooperativeId: 1, // Por defecto, se puede hacer dinámico después
    firstName: "",
    lastName: "",
    documentType: "CC",
    documentNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    department: "",
    birthDate: "",
    gender: "M",
    occupation: "",
    status: "activo",
    monthlyContribution: 0,
    assistantId: "",
    businessName: "",
    paymentStatus: "pending",
    // Campos adicionales del Excel
    riskLevel: "",
    eps: "",
    arl: "",
    ccf: "",
    afp: "",
    plan: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (affiliate) {
      // Intentar parsear notes si contiene información adicional
      let additionalInfo = {};
      try {
        if (affiliate.notes) {
          additionalInfo = JSON.parse(affiliate.notes);
        }
      } catch (e) {
        // Si no es JSON, ignorar
      }
      
      setFormData({
        cooperativeId: affiliate.cooperativeId || 1,
        firstName: affiliate.firstName || "",
        lastName: affiliate.lastName || "",
        documentType: affiliate.documentType || "CC",
        documentNumber: affiliate.documentNumber || "",
        email: affiliate.email || "",
        phone: affiliate.phone || additionalInfo.celular || "",
        address: affiliate.address || additionalInfo.direccion || "",
        city: affiliate.city || "",
        department: affiliate.department || "",
        birthDate: affiliate.birthDate ? affiliate.birthDate.split("T")[0] : "",
        gender: affiliate.gender || "M",
        occupation: affiliate.occupation || additionalInfo.ocupacion || "",
        status: affiliate.status || "activo",
        monthlyContribution: affiliate.monthlyContribution || 0,
        assistantId: affiliate.assistantId || "",
        businessName: affiliate.businessName || "",
        paymentStatus: affiliate.paymentStatus || "pending",
        // Campos adicionales del Excel
        riskLevel: additionalInfo.riesgo || "",
        eps: additionalInfo.eps || "",
        arl: additionalInfo.arl || "",
        ccf: additionalInfo.ccf || "",
        afp: additionalInfo.afp || "",
        plan: additionalInfo.plan || "",
      });
    }
  }, [affiliate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Guardar información adicional en notes como JSON
      const additionalInfo = {
        riesgo: formData.riskLevel || null,
        eps: formData.eps || null,
        arl: formData.arl || null,
        ccf: formData.ccf || null,
        afp: formData.afp || null,
        plan: formData.plan || null,
      };
      
      // Si hay información adicional, agregarla a notes
      let notes = null;
      if (Object.values(additionalInfo).some(v => v !== null)) {
        // Si ya hay notes, intentar parsearlas y combinarlas
        try {
          const existingNotes = affiliate?.notes ? JSON.parse(affiliate.notes) : {};
          notes = JSON.stringify({ ...existingNotes, ...additionalInfo });
        } catch (e) {
          notes = JSON.stringify(additionalInfo);
        }
      }
      
      // Preparar datos para envío, convirtiendo strings vacíos a null
      const submitData = {
        cooperativeId: parseInt(formData.cooperativeId) || 1,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        documentType: formData.documentType,
        documentNumber: formData.documentNumber.trim(),
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() ? formData.email.trim() : null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        department: formData.department?.trim() || null,
        birthDate: formData.birthDate || null,
        gender: formData.gender || null,
        occupation: formData.occupation?.trim() || null,
        status: formData.status || 'activo',
        monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
        notes: notes || affiliate?.notes || null,
        assistantId: formData.assistantId?.trim() || null,
        businessName: formData.businessName?.trim() || null,
        paymentStatus: formData.paymentStatus || null,
      };
      
      // Remover campos null para evitar problemas con la validación
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === null || submitData[key] === '') {
          // Mantener null para campos opcionales, pero asegurar que no sean strings vacíos
          if (submitData[key] === '') {
            submitData[key] = null;
          }
        }
      });

      const result = affiliate
        ? await affiliatesAPI.update(affiliate.id, submitData)
        : await affiliatesAPI.create(submitData);

      if (result.success !== false) {
        onClose();
      } else {
        setError(result.message || "Error al guardar el afiliado");
      }
    } catch (err) {
      let errorMsg = "Error al guardar el afiliado";
      
      if (err.response?.data) {
        // Si hay errores de validación, mostrar el primero
        if (err.response.data.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
          errorMsg = err.response.data.errors[0].message || err.response.data.message || errorMsg;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {affiliate ? "Editar Afiliado" : "Nuevo Afiliado"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Documento *
              </label>
              <select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Documento *
              </label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Departamento
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ocupación
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aporte Mensual (COP)
              </label>
              <input
                type="number"
                name="monthlyContribution"
                value={formData.monthlyContribution}
                onChange={handleChange}
                min="0"
                step="100"
                placeholder="0"
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              />
              {formData.monthlyContribution > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(formData.monthlyContribution)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="moroso">Moroso</option>
                <option value="retirado">Retirado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Auxiliar
              </label>
              <select
                name="assistantId"
                value={formData.assistantId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              >
                <option value="">Seleccionar auxiliar</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Razón Social
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                placeholder="Nombre de la empresa o razón social"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado de Pago
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
              >
                <option value="pending">Falta por pagar</option>
                <option value="paid">Pagó (Pendiente pagar planilla)</option>
                <option value="paid_payroll">Planilla pagada</option>
                <option value="new">Nuevo</option>
                <option value="retired">Retiro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dirección
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Campos adicionales del Excel */}
          <div className="border-t border-panel/50 pt-4">
            <h3 className="text-lg font-semibold text-white mb-4">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nivel de Riesgo ARL
                </label>
                <select
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                >
                  <option value="">Seleccionar</option>
                  <option value="1">Riesgo 1</option>
                  <option value="2">Riesgo 2</option>
                  <option value="3">Riesgo 3</option>
                  <option value="4">Riesgo 4</option>
                  <option value="5">Riesgo 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  EPS
                </label>
                <input
                  type="text"
                  name="eps"
                  value={formData.eps}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Salud Total, Sura, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ARL
                </label>
                <input
                  type="text"
                  name="arl"
                  value={formData.arl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  placeholder="Ej: La Equidad, Sura, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CCF (Caja de Compensación)
                </label>
                <input
                  type="text"
                  name="ccf"
                  value={formData.ccf}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Comfenalco, Comfandi, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AFP (Pensión)
                </label>
                <input
                  type="text"
                  name="afp"
                  value={formData.afp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                  placeholder="Ej: Porvenir, Colfondos, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plan de Servicio
                </label>
                <select
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                >
                  <option value="">Seleccionar</option>
                  <option value="VITAL">VITAL</option>
                  <option value="BÁSICO">BÁSICO</option>
                  <option value="COMPLEMENTARIO">COMPLEMENTARIO</option>
                  <option value="INTEGRAL">INTEGRAL</option>
                  <option value="Solo ARL">Solo ARL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : affiliate ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

