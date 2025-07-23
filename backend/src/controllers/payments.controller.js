import { stripe } from '../config/stripe.js';

export const createCheckoutSession = async (request, reply) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Recarga BetSlip',
          },
          unit_amount: 100, // $1 en centavos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:5500/perfil.html', // Cambia a tu ruta real
      cancel_url: 'http://localhost:5500/perfil.html',
    });

    reply.send({ url: session.url });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Error al crear la sesión de pago' });
  }
};
