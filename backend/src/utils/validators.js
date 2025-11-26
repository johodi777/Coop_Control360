const Joi = require('joi');

// Validaciones para Afiliados
const affiliateSchema = Joi.object({
  cooperativeId: Joi.number().integer().required(),
  firstName: Joi.string().min(2).max(150).required(),
  lastName: Joi.string().min(2).max(150).required(),
  documentType: Joi.string().valid('CC', 'CE', 'NIT', 'PASAPORTE', 'TI').required(),
  documentNumber: Joi.string().min(5).max(50).required(),
  phone: Joi.string().max(50).allow('', null).optional(),
  email: Joi.string().max(255).allow('', null).custom((value, helpers) => {
    if (!value || value === '') {
      return value; // Permitir vacío o null
    }
    // Validar formato de email solo si tiene valor
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return helpers.error('string.email');
    }
    return value;
  }).optional(),
  address: Joi.string().allow('', null).optional(),
  city: Joi.string().max(100).allow('', null),
  department: Joi.string().max(100).allow('', null),
  birthDate: Joi.date().allow(null),
  gender: Joi.string().valid('M', 'F', 'OTRO').allow('', null),
  occupation: Joi.string().max(150).allow('', null),
  status: Joi.string().valid('activo', 'suspendido', 'moroso', 'retirado').allow('', null),
  monthlyContribution: Joi.number().min(0).precision(2).allow(null),
  notes: Joi.string().allow('', null),
  assistantId: Joi.string().max(50).allow('', null),
  businessName: Joi.string().max(255).allow('', null),
  paymentStatus: Joi.string().valid('pending', 'paid', 'paid_payroll', 'pending_contribution', 'new', 'retired').allow('', null)
});

// Validaciones para Usuarios
const userSchema = Joi.object({
  fullName: Joi.string().min(3).max(150),
  name: Joi.string().min(3).max(150), // Alias para fullName
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(100).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  phone: Joi.string().max(50).allow('', null),
  documentNumber: Joi.string().max(50).allow('', null),
  position: Joi.string().max(100).allow('', null),
  roleName: Joi.string().valid('superadmin', 'admin', 'operador', 'auditor', 'afiliado'),
  roleId: Joi.number().integer().min(1) // Permitir roleId como alternativa
}).or('fullName', 'name').messages({
  'object.missing': 'Se requiere el campo "fullName" o "name"'
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Validaciones para Facturas
const invoiceSchema = Joi.object({
  affiliateId: Joi.number().integer().required(),
  concept: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow('', null),
  baseAmount: Joi.number().min(0).precision(2).required(),
  tax: Joi.number().min(0).precision(2),
  discount: Joi.number().min(0).precision(2),
  dueDate: Joi.date().required(),
  period: Joi.string().pattern(/^\d{4}-\d{2}$/).allow('', null),
  isRecurring: Joi.boolean()
});

// Validaciones para Transacciones
const transactionSchema = Joi.object({
  affiliateId: Joi.number().integer().required(),
  invoiceId: Joi.number().integer().allow(null),
  paymentMethod: Joi.string().valid('efectivo', 'transferencia', 'nequi', 'daviplata', 'payu', 'mercadopago', 'otro').required(),
  amount: Joi.number().min(0.01).precision(2).required(),
  reference: Joi.string().max(200).allow('', null),
  paymentGateway: Joi.string().max(50).allow('', null)
});

// Validaciones para Servicios
const serviceSchema = Joi.object({
  name: Joi.string().min(3).max(150).required(),
  code: Joi.string().max(50).allow('', null),
  description: Joi.string().allow('', null),
  category: Joi.string().valid('salud', 'auxilio', 'poliza', 'funerario', 'educativo', 'recreativo', 'otro').required(),
  requirements: Joi.string().allow('', null),
  maxAmount: Joi.number().min(0).precision(2).allow(null),
  isActive: Joi.boolean(),
  requiresApproval: Joi.boolean(),
  minAffiliationMonths: Joi.number().integer().min(0),
  maxRequestsPerYear: Joi.number().integer().min(0).allow(null)
});

// Validaciones para Solicitudes de Servicio
const serviceRequestSchema = Joi.object({
  affiliateId: Joi.number().integer().required(),
  serviceId: Joi.number().integer().required(),
  description: Joi.string().min(10).required(),
  requestedAmount: Joi.number().min(0).precision(2).allow(null)
});

// Validaciones para PQRS
const pqrsSchema = Joi.object({
  affiliateId: Joi.number().integer().required(),
  type: Joi.string().valid('peticion', 'queja', 'reclamo', 'sugerencia').required(),
  subject: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(10).required(),
  priority: Joi.string().valid('baja', 'media', 'alta', 'urgente')
});

// Validaciones para Beneficiarios
const beneficiarySchema = Joi.object({
  affiliateId: Joi.number().integer().required(),
  firstName: Joi.string().min(2).max(150).required(),
  lastName: Joi.string().min(2).max(150).required(),
  documentType: Joi.string().valid('CC', 'CE', 'TI', 'PASAPORTE').required(),
  documentNumber: Joi.string().min(5).max(50).required(),
  relationship: Joi.string().valid('conyuge', 'hijo', 'hija', 'padre', 'madre', 'otro').required(),
  birthDate: Joi.date().allow(null),
  gender: Joi.string().valid('M', 'F', 'OTRO').allow('', null),
  phone: Joi.string().max(50).allow('', null),
  email: Joi.string().email().max(255).allow('', null),
  percentage: Joi.number().min(0).max(100).precision(2)
});

module.exports = {
  affiliateSchema,
  userSchema,
  loginSchema,
  invoiceSchema,
  transactionSchema,
  serviceSchema,
  serviceRequestSchema,
  pqrsSchema,
  beneficiarySchema
};

