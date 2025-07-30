import { createCheckout, stripeWebhook } from '../controllers/payments.controller.js';

export default async function paymentsRoutes(app) {
  app.post('/payments/create-checkout-session', createCheckout);

  app.route({
    method: 'POST',
    url: '/payments/webhook',
    handler: stripeWebhook,
    config: { rawBody: true } // necesario para validar webhook Stripe
  });
}
