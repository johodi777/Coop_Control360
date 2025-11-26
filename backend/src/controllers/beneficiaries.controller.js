const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const Beneficiary = db.Beneficiary;

exports.create = async (req, res, next) => {
  try {
    const { affiliateId } = req.params;
    
    // Verificar que el afiliado existe
    const affiliate = await db.Affiliate.findByPk(affiliateId);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Afiliado no encontrado'
      });
    }

    const beneficiary = await Beneficiary.create({
      ...req.body,
      affiliateId
    });

    const result = await Beneficiary.findByPk(beneficiary.id, {
      include: [
        { model: db.Affiliate, attributes: ['id', 'firstName', 'lastName', 'documentNumber'] }
      ]
    });

    logger.info(`Beneficiario creado: ${beneficiary.id} para afiliado ${affiliateId}`);
    
    res.status(201).json({
      success: true,
      message: 'Beneficiario creado exitosamente',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { affiliateId } = req.params;
    
    const beneficiaries = await Beneficiary.findAll({
      where: { affiliateId, isActive: true },
      include: [
        { model: db.Affiliate, attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: beneficiaries
    });
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const beneficiary = await Beneficiary.findByPk(id, {
      include: [
        { model: db.Affiliate, attributes: ['id', 'firstName', 'lastName', 'documentNumber'] }
      ]
    });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiario no encontrado'
      });
    }

    res.json({
      success: true,
      data: beneficiary
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const beneficiary = await Beneficiary.findByPk(id);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiario no encontrado'
      });
    }

    await beneficiary.update(req.body);
    
    const updated = await Beneficiary.findByPk(id, {
      include: [
        { model: db.Affiliate, attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    logger.info(`Beneficiario actualizado: ${id} por usuario ${req.user.id}`);

    res.json({
      success: true,
      message: 'Beneficiario actualizado exitosamente',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const beneficiary = await Beneficiary.findByPk(id);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiario no encontrado'
      });
    }

    await beneficiary.update({ isActive: false });
    
    logger.info(`Beneficiario eliminado: ${id} por usuario ${req.user.id}`);

    res.json({
      success: true,
      message: 'Beneficiario eliminado exitosamente'
    });
  } catch (err) {
    next(err);
  }
};

