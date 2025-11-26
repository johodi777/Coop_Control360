const db = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const PDFGenerator = require('../utils/pdfGenerator');
const logger = require('../utils/logger');
const moment = require('moment');

// Reporte financiero
exports.financialReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Total facturado
    const totalInvoiced = await db.Invoice.sum('total', { where });
    
    // Total pagado
    const totalPaid = await db.Transaction.sum('amount', {
      where: {
        ...where,
        status: 'exitoso'
      }
    }) || 0;

    // Total pendiente
    const totalPending = await db.Invoice.sum('total', {
      where: {
        ...where,
        status: 'pendiente'
      }
    }) || 0;

    // Facturas por estado
    const invoicesByStatus = await db.Invoice.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      where,
      group: ['status']
    });

    // Transacciones recientes
    const recentTransactions = await db.Transaction.findAll({
      where: {
        ...where,
        status: 'exitoso'
      },
      include: [
        {
          model: db.Affiliate,
          attributes: ['id', 'firstName', 'lastName', 'documentNumber']
        },
        {
          model: db.Invoice,
          attributes: ['id', 'concept', 'period']
        }
      ],
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    const reportData = {
      summary: {
        totalInvoiced: parseFloat(totalInvoiced || 0),
        totalPaid: parseFloat(totalPaid),
        totalPending: parseFloat(totalPending || 0),
        period: {
          startDate: startDate || 'Inicio',
          endDate: endDate || 'Actual'
        }
      },
      invoicesByStatus,
      recentTransactions
    };

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateReport(
        reportData,
        'Reporte Financiero',
        'financial'
      );
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-financiero-${moment().format('YYYY-MM-DD')}.pdf`);
      return res.send(pdfBuffer);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (err) {
    next(err);
  }
};

// Reporte de afiliados
exports.affiliatesReport = async (req, res, next) => {
  try {
    const { status, format = 'json' } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const total = await db.Affiliate.count({ where });
    const active = await db.Affiliate.count({ where: { ...where, status: 'activo' } });
    const moroso = await db.Affiliate.count({ where: { ...where, status: 'moroso' } });
    const suspendido = await db.Affiliate.count({ where: { ...where, status: 'suspendido' } });

    // Afiliados por mes
    const affiliatesByMonth = await db.Affiliate.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('affiliationDate'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where,
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('affiliationDate'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('affiliationDate'), '%Y-%m'), 'DESC']],
      limit: 12
    });

    // Afiliados recientes
    const recentAffiliates = await db.Affiliate.findAll({
      where,
      include: [
        { model: db.Cooperative, attributes: ['id', 'name'] }
      ],
      limit: 20,
      order: [['createdAt', 'DESC']]
    });

    const reportData = {
      summary: {
        total,
        active,
        moroso,
        suspendido
      },
      affiliatesByMonth,
      recentAffiliates
    };

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateReport(
        reportData,
        'Reporte de Afiliados',
        'affiliates'
      );
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-afiliados-${moment().format('YYYY-MM-DD')}.pdf`);
      return res.send(pdfBuffer);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (err) {
    next(err);
  }
};

// Reporte de servicios
exports.servicesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Solicitudes por estado
    const requestsByStatus = await db.ServiceRequest.findAll({
      attributes: [
        'state',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where,
      group: ['state']
    });

    // Solicitudes por servicio
    const requestsByService = await db.ServiceRequest.findAll({
      attributes: [
        [Sequelize.col('Service.name'), 'serviceName'],
        [Sequelize.fn('COUNT', Sequelize.col('ServiceRequest.id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('ServiceRequest.approvedAmount')), 'totalApproved']
      ],
      include: [
        {
          model: db.Service,
          attributes: []
        }
      ],
      where,
      group: [Sequelize.col('Service.name')],
      raw: true
    });

    // Solicitudes recientes
    const recentRequests = await db.ServiceRequest.findAll({
      where,
      include: [
        {
          model: db.Service,
          attributes: ['id', 'name', 'category']
        },
        {
          model: db.Affiliate,
          attributes: ['id', 'firstName', 'lastName', 'documentNumber']
        }
      ],
      limit: 30,
      order: [['createdAt', 'DESC']]
    });

    const reportData = {
      requestsByStatus,
      requestsByService,
      recentRequests
    };

    if (format === 'pdf') {
      const pdfBuffer = await PDFGenerator.generateReport(
        reportData,
        'Reporte de Servicios',
        'general'
      );
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-servicios-${moment().format('YYYY-MM-DD')}.pdf`);
      return res.send(pdfBuffer);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (err) {
    next(err);
  }
};

// Dashboard - Métricas generales
exports.dashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Métricas generales - con manejo de errores
    let totalAffiliates = 0;
    let activeAffiliates = 0;
    let morosoAffiliates = 0;
    
    try {
      totalAffiliates = await db.Affiliate.count();
      activeAffiliates = await db.Affiliate.count({ where: { status: 'activo' } });
      morosoAffiliates = await db.Affiliate.count({ where: { status: 'moroso' } });
    } catch (err) {
      logger.warn('Error obteniendo métricas de afiliados:', err.message);
    }

    // Financiero - con manejo de errores
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let monthInvoiced = 0;
    let monthPaid = 0;
    
    try {
      totalInvoiced = await db.Invoice.sum('total') || 0;
      totalPaid = await db.Transaction.sum('amount', {
        where: { status: 'exitoso' }
      }) || 0;
      totalPending = await db.Invoice.sum('total', {
        where: { status: 'pendiente' }
      }) || 0;
      monthInvoiced = await db.Invoice.sum('total', {
        where: { createdAt: { [Op.gte]: startOfMonth } }
      }) || 0;
      monthPaid = await db.Transaction.sum('amount', {
        where: {
          status: 'exitoso',
          createdAt: { [Op.gte]: startOfMonth }
        }
      }) || 0;
    } catch (err) {
      logger.warn('Error obteniendo métricas financieras:', err.message);
    }

    // Servicios - con manejo de errores
    let pendingServices = 0;
    let approvedServices = 0;
    
    try {
      pendingServices = await db.ServiceRequest.count({
        where: { state: 'pendiente' }
      });
      approvedServices = await db.ServiceRequest.count({
        where: { state: 'aprobado' }
      });
    } catch (err) {
      logger.warn('Error obteniendo métricas de servicios:', err.message);
    }

    // PQRS - con manejo de errores
    let openPqrs = 0;
    
    try {
      openPqrs = await db.Pqrs.count({
        where: { status: { [Op.in]: ['abierto', 'en_proceso'] } }
      });
    } catch (err) {
      logger.warn('Error obteniendo métricas de PQRS:', err.message);
    }

    // Tendencia de aportes - últimos 6 meses - con manejo de errores
    const monthsData = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    try {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        let monthTotal = 0;
        try {
          monthTotal = await db.Transaction.sum('amount', {
            where: {
              status: 'exitoso',
              createdAt: {
                [Op.gte]: date,
                [Op.lt]: nextMonth
              }
            }
          }) || 0;
        } catch (err) {
          logger.warn(`Error obteniendo datos del mes ${i}:`, err.message);
        }

        monthsData.push({
          name: monthNames[date.getMonth()],
          value: parseFloat(monthTotal),
          fullName: `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        });
      }
    } catch (err) {
      logger.warn('Error obteniendo tendencia de aportes:', err.message);
    }

    res.json({
      success: true,
      data: {
        affiliates: {
          total: totalAffiliates,
          active: activeAffiliates,
          moroso: morosoAffiliates
        },
        financial: {
          totalInvoiced: parseFloat(totalInvoiced),
          totalPaid: parseFloat(totalPaid),
          totalPending: parseFloat(totalPending),
          monthInvoiced: parseFloat(monthInvoiced),
          monthPaid: parseFloat(monthPaid)
        },
        services: {
          pending: pendingServices,
          approved: approvedServices
        },
        pqrs: {
          open: openPqrs
        },
        contributionsTrend: monthsData
      }
    });
  } catch (err) {
    next(err);
  }
};

