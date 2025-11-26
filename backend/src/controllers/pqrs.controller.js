const db = require('../models');
const Pqrs = db.Pqrs;
const PqrsResponse = db.PqrsResponse;

exports.create = async (req, res) => {
  try {
    const { type, description } = req.body;
    const pq = await Pqrs.create({ affiliateId: req.body.affiliateId, type, description });
    res.status(201).json(pq);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
};

exports.respond = async (req, res) => {
  try {
    const { pqrsId, response } = req.body;
    const r = await PqrsResponse.create({ pqrsId, userId: req.user.id, response });
    res.status(201).json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal error' });
  }
};
