// routes/payments.routes.js
const express = require('express');
const router = express.Router();
const { handleCreateCheckoutSession } = require('../controllers/payments.controller');

router.post('/create-checkout-session', handleCreateCheckoutSession);

module.exports = router;


// api/payments.api.js
const paymentsRoutes = require('../src/routes/payments.routes');

module.exports = (app) => {
  app.use('/api/payments', paymentsRoutes);
};
