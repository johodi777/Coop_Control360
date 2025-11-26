const db = require('../models');
const AuditLog = db.AuditLog;

exports.list = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ limit: 500, order: [['createdAt','DESC']] });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
};
