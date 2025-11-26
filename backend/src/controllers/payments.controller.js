const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const Invoice = db.Invoice;
const Transaction = db.Transaction;
const Affiliate = db.Affiliate;

// Generar número de factura único
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  
  // Buscar el último número de factura del año
  const lastInvoice = await Invoice.findOne({
    where: {
      invoiceNumber: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['invoiceNumber', 'DESC']]
  });

  let sequence = 1;
  if (lastInvoice && lastInvoice.invoiceNumber) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

// Generar referencia única de pago
async function generatePaymentReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const reference = `REF-${timestamp}-${random}`;
  
  // Verificar que no exista
  const exists = await Transaction.findOne({ where: { reference } });
  if (exists) {
    // Si existe, generar otra
    return generatePaymentReference();
  }
  
  return reference;
}

// Generar número de transacción único
async function generateTransactionNumber() {
  const year = new Date().getFullYear();
  const prefix = `TXN-${year}-`;
  
  const lastTransaction = await Transaction.findOne({
    where: {
      transactionNumber: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['transactionNumber', 'DESC']]
  });

  let sequence = 1;
  if (lastTransaction && lastTransaction.transactionNumber) {
    const lastSequence = parseInt(lastTransaction.transactionNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(6, '0')}`;
}

exports.createInvoice = async (req, res) => {
  try {
    const { affiliateId, total } = req.body;
    const invoiceNumber = await generateInvoiceNumber();
    const inv = await Invoice.create({ 
      affiliateId, 
      total,
      invoiceNumber 
    });
    res.status(201).json(inv);
  } catch (err) {
    logger.error('Error creando factura:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { affiliateId, invoiceId, paymentMethod, amount, paymentGateway } = req.body;
    
    // Validar que el afiliado existe
    const affiliate = await Affiliate.findByPk(affiliateId);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Afiliado no encontrado'
      });
    }

    // Generar referencias automáticas
    const reference = await generatePaymentReference();
    const transactionNumber = await generateTransactionNumber();
    
    // Si hay invoiceId, verificar que existe
    let invoice = null;
    if (invoiceId) {
      invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }
    } else {
      // Crear factura automática si no se proporciona
      const invoiceNumber = await generateInvoiceNumber();
      invoice = await Invoice.create({
        affiliateId,
        invoiceNumber,
        concept: 'Pago de aporte',
        description: `Pago registrado el ${new Date().toLocaleDateString('es-CO')}`,
        baseAmount: amount,
        tax: 0,
        discount: 0,
        total: amount,
        dueDate: new Date(),
        status: 'pagado'
      });
    }

    // Crear la transacción
    const transaction = await Transaction.create({
      affiliateId,
      invoiceId: invoice.id,
      transactionNumber,
      paymentMethod,
      reference,
      amount: parseFloat(amount),
      paymentGateway: paymentGateway || null,
      status: 'exitoso',
      processedBy: req.user?.id || null,
      processedAt: new Date()
    });

    // Actualizar factura si existe
    if (invoice) {
      await invoice.update({
        status: 'pagado',
        paidDate: new Date(),
        paymentMethod: paymentMethod,
        reference: reference
      });
    }

    // Obtener la transacción completa con relaciones
    const transactionWithRelations = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Affiliate, attributes: ['id', 'firstName', 'lastName', 'documentType', 'documentNumber', 'email', 'phone', 'address'] },
        { model: Invoice, attributes: ['id', 'invoiceNumber', 'concept', 'total'] }
      ]
    });

    logger.info(`Transacción creada: ${transactionNumber} por usuario ${req.user?.id || 'sistema'}`);

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: transactionWithRelations
    });
  } catch (err) {
    logger.error('Error creando transacción:', err);
    next(err);
  }
};

// Obtener transacción por ID para recibo
exports.getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findByPk(id, {
      include: [
        { 
          model: Affiliate, 
          attributes: ['id', 'firstName', 'lastName', 'documentType', 'documentNumber', 'email', 'phone', 'address', 'city', 'department'] 
        },
        { 
          model: Invoice, 
          attributes: ['id', 'invoiceNumber', 'concept', 'description', 'total', 'baseAmount', 'tax', 'discount'] 
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// Listar transacciones
exports.listTransactions = async (req, res, next) => {
  try {
    const { affiliateId, status, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (affiliateId) where.affiliateId = affiliateId;
    if (status) where.status = status;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Affiliate, attributes: ['id', 'firstName', 'lastName', 'documentNumber'] },
        { model: Invoice, attributes: ['id', 'invoiceNumber', 'concept'] }
      ]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};
