import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createProductAndPrice = async ({ name, amount }) => {
  return await stripe.prices.create({
    currency: 'usd',
    unit_amount: amount,
    product_data: { name },
  });
};

export const createCheckoutSession = async ({ priceId, quantity = 1, userId }) => {
  return await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity }],
    success_url: `${process.env.DOMAIN_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`,
    payment_method_types: ['card'],
    metadata: {
      userId // Pasamos el userId para luego obtenerlo en el webhook
    },
  });
};
