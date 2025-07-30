import { createProductAndPrice, createCheckoutSession } from '../services/payments.service.js';
import { updateUserBalance } from '../services/user.service.js'; // suponiendo que tienes esto

export const createCheckout = async (request, reply) => {
  try {
    const { amount, userId } = request.body; // IMPORTANTE: frontend debe enviar userId en el body también

    if (!amount || amount < 100) {
      return reply.code(400).send({ message: 'Monto inválido' });
    }

    const price = await createProductAndPrice({
      name: `Recarga de saldo`,
      amount,
    });

    const session = await createCheckoutSession({ priceId: price.id, quantity: 1, userId });

    reply.code(200).send({ url: session.url });
  } catch (error) {
    console.error('Error al crear sesión de Stripe:', error);
    reply.code(500).send({ message: 'Error interno del servidor' });
  }
};

// Webhook para Stripe
export const stripeWebhook = async (request, reply) => {
  const stripe = await import('stripe').then(mod => mod.default(process.env.STRIPE_SECRET_KEY));
  const sig = request.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    reply.code(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total;
    const userId = session.metadata?.userId;

    if (userId) {
      await updateUserBalance(userId, amount);
    }
  }

  reply.send();
};
