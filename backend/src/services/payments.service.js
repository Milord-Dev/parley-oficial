// payments.services.js
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Esta función es útil si quieres crear productos/precios de forma independiente
export const createProductAndPrice = async ({ name, amount }) => {
  return await stripe.prices.create({
    currency: "usd",
    unit_amount: amount, // Stripe espera el monto en centavos
    product_data: { name },
  });
};

// --- CAMBIO IMPORTANTE AQUÍ ---
// Ahora esta función puede crear la sesión de checkout directamente con el monto y nombre del producto,
// o si ya tienes un priceId predefinido, puedes usarlo.
export const createCheckoutSession = async ({
  amount, // Nuevo parámetro para el monto
  productName = 'Agregar fondos', // Nuevo parámetro para el nombre del producto, con un valor por defecto
  userId,
  priceId, // Opcional: si ya tienes un priceId existente
}) => {
  let lineItemsConfig;

  if (priceId) {
    // Si se proporciona un priceId, úsalo
    lineItemsConfig = [{ price: priceId, quantity: 1 }];
  } else if (amount) {
    // Si se proporciona un monto, crea la price_data inline
    lineItemsConfig = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: productName
        },
        unit_amount: amount * 100, // Siempre en centavos
      },
      quantity: 1,
    }];
  } else {
    throw new Error('Debe proporcionar un "amount" o un "priceId" para crear la sesión de checkout.');
  }

  return await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItemsConfig,
    success_url: `${process.env.DOMAIN_URL}/frontend/pages/perfil.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN_URL}/frontend/pages/perfil.html?session_id={CHECKOUT_SESSION_ID}`, // Corregido 'perfli.html' a 'perfil.html'
    payment_method_types: ["card"],
    metadata: {
      userId, // Pasamos el userId para luego obtenerlo en el webhook
      amount: amount ? amount.toString() : 'N/A' // Guardar el monto original si está disponible
    },
  });
};
