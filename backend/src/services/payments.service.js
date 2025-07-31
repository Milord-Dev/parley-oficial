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


// esta función puede crear la sesión de checkout directamente con el monto y nombre del producto

export const createCheckoutSession = async ({
  amount, // Nuevo parámetro para el monto
  productName = 'Agregar fondos', // parámetro para el nombre del producto con un valor por defecto
  userId,
  priceId, 
}) => {
  let lineItemsConfig;

  if (priceId) {
    // Si se proporciona un priceId lo usamos
    lineItemsConfig = [{ price: priceId, quantity: 1 }];
  } else if (amount) {
    // Si se proporciona un monto crea la price_data inline
    lineItemsConfig = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: productName
        },
        unit_amount: Math.round(parseFloat(amount) * 100),
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
      amount: Math.round(parseFloat(amount) * 100).toString() // Guardar el monto original si está disponible
    },
  });
};
