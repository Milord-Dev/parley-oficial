// controllers/payments.controller.js
const { createCheckoutSession } = require('../services/payments.service');

const handleCreateCheckoutSession = async (req, res) => {
  try {
    const session = await createCheckoutSession(req.body.items);
    res.status(200).json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  handleCreateCheckoutSession,
};
