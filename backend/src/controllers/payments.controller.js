// payments.controller.js
import { updateUserBalance } from "../services/user.service.js";
import Order from "../models/order.js";
import Stripe from "stripe";
import { getTotalAmountByUserId } from "../services/user.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckout(req, reply) {
  const { amount, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Agregar fondos",
            },
            unit_amount: amount, // Stripe espera el monto en centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.DOMAIN_URL}/frontend/pages/perfil.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN_URL}/frontend/pages/perfli.html?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: userId,
        amount: amount.toString(), // Guardar el monto original para referencia en el webhook si es necesario
      },
    });

    // Guarda la orden con los campos correctos según tu esquema
    await Order.create({
      user_id: userId,
      checkout_session_id: session.id, // Ahora se mapea directamente al campo del esquema
      amount: amount, // Ahora se mapea directamente al campo del esquema
      status: "pending", // Asignamos un estado inicial a la orden
    });

    return reply.send({ url: session.url });
  } catch (error) {
    console.error("Error al crear la sesión de checkout:", error);
    return reply
      .status(500)
      .send({ error: "Error al crear la sesión de checkout." });
  }
}

// Webhook para Stripe
export async function stripeWebhook(req, reply) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Es crucial usar req.rawBody aquí, no req.body, ya que Stripe necesita el cuerpo RAW
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Error:", err.message);
    // Devuelve un 400 si la firma no es válida
    return reply.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Maneja los diferentes tipos de eventos
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      console.log("Checkout Session Completed:", session.id);

      const userId = session.metadata.userId;
      // Stripe devuelve amount_total en centavos, lo convertimos a la unidad original
      const amountPaid = session.amount_total / 100;

      try {
        // 1. Buscar y actualizar la orden por el checkout_session_id
        // Actualizamos el estado de la orden a 'succeeded'
        const updatedOrder = await Order.findOneAndUpdate(
          { checkout_session_id: session.id },
          { status: "succeeded" },
          { new: true } // Retorna el documento actualizado
        );

        if (updatedOrder) {
          console.log(`Orden ${updatedOrder._id} actualizada a 'succeeded'.`);
          // 2. Sumar saldo al usuario solo si la orden se actualizó correctamente
          await updateUserBalance(userId, amountPaid);
          console.log(
            `Saldo del usuario ${userId} actualizado con ${amountPaid}.`
          );
        } else {
          console.warn(
            `Orden con checkout_session_id ${session.id} no encontrada para actualizar.`
          );
        }
      } catch (dbError) {
        console.error(
          "Error al actualizar la orden o el saldo del usuario:",
          dbError
        );
        // Podrías querer registrar este error o tener un sistema de reintentos
        return reply
          .status(500)
          .send("Error interno del servidor al procesar el webhook.");
      }
      break;
    // Puedes añadir más casos para otros eventos de Stripe si los necesitas
    // case 'payment_intent.succeeded':
    //   // ...
    //   break;
    default:
      console.log(`Evento Stripe no manejado: ${event.type}`);
  }

  // Responde con un 200 OK a Stripe para indicar que el evento fue recibido
  reply.send();
}

export const getUserBalance = async (request, reply) => {
  const userId = request.user?.id; // 👈 esto depende de cómo firmaste el token

  if (!userId) {
    return reply.status(401).send({ message: 'No autorizado' });
  }

  const balance = await getTotalAmountByUserId(userId);
  return { balance };
};

