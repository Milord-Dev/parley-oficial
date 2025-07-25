import { createCheckoutSession } from '../controllers/payments.controller.js';

export default async function paymentsRoutes(app) {
  app.post('/payments/create-checkout-session', createCheckoutSession);
}
