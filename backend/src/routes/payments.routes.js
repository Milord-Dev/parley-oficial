import { createCheckout, stripeWebhook, getUserBalance } from '../controllers/payments.controller.js';

export default async function paymentsRoutes(app) {
  // Ruta para crear sesión de pago con Stripe
  app.post('/payments/create-checkout-session', createCheckout);

  // Ruta para recibir el webhook de Stripe
  app.route({
    method: 'POST',
    url: '/payments/webhook',
    handler: stripeWebhook,
    config: { rawBody: true }, // necesario para validar webhook Stripe
  });

  // Ruta para obtener el balance del usuario
  app.get('/payments/balance', { preHandler: [app.authenticate] }, getUserBalance);
}
