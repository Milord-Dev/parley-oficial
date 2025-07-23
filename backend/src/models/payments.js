
// api/payments.api.js
const paymentsRoutes = require('../src/routes/payments.routes');

module.exports = (app) => {
  app.use('/api/payments', paymentsRoutes);
};
