// payments.controller.js
import { updateUserBalance } from "../services/user.service.js";
import Order from "../models/order.js";
import Stripe from "stripe";
import { getTotalAmountByUserId } from "../services/user.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckout(req, reply) {
  const { amount, userId } = req.body;

  req.log.info({
    receivedAmount: amount, // Monto recibido del frontend
    receivedUserId: userId
  }, 'createCheckout: Recibiendo datos para crear sesión.');

  try {
    req.log.info({
      amountToSendToStripe: amount,
      userIdForMetadata: userId
    }, 'createCheckout: Llamando a Stripe para crear sesión de checkout.');

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


    req.log.info({
      stripeSessionId: session.id,
      stripeSessionUrl: session.url
    }, 'createCheckout: Sesión de Stripe creada exitosamente.');

    // Guarda la orden con los campos correctos según tu esquema
    await Order.create({
      user_id: userId,
      checkout_session_id: session.id, 
      amount: amount, 
      status: "pending", // Asignamos un estado inicial a la orden
    });

    return reply.send({ url: session.url });
  } catch (error) {
    console.error("Error al crear la sesión de checkout:", error);

    if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
        req.log.error({ stripeErrorType: error.type, stripeErrorMessage: error.message, stripeErrorCode: error.code }, 'createCheckout: Error específico de Stripe.');
    
    }    
    
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
    // Es crucial usar req.rawBody aquí, ya que Stripe necesita el cuerpo RAW
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    req.log.info({ eventId: event.id, eventType: event.type }, 'Webhook: Firma verificada y evento construido.');
  } catch (err) {
    req.log.error(err, "Webhook: Falló la verificación de firma o rawBody es nulo/inválido.");
    console.error("Webhook Error:", err.message);
    // Devuelve un 400 si la firma no es válida
    return reply.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Maneja los diferentes tipos de eventos
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      req.log.info({ sessionId: session.id, amountTotal: session.amount_total, userId: session.metadata.userId }, "Webhook: checkout.session.completed recibido.");

      const userId = session.metadata.userId;
      // Stripe devuelve amount_total en centavos, lo convertimos a la unidad original
      const amountPaidInCents = session.amount_total;

      try {
        req.log.info({ checkoutSessionId: session.id }, "Webhook: Buscando y actualizando orden a 'succeeded'.");
        // buscar y actualizar la orden por el checkout_session_id
        // actualizamos el estado de la orden a 'succeeded'
        const updatedOrder = await Order.findOneAndUpdate(
          { checkout_session_id: session.id },
          { status: "succeeded" },
          { new: true } // Retorna el documento actualizado
        );

        if (updatedOrder) {
          req.log.info({ orderId: updatedOrder._id, orderStatus: updatedOrder.status }, `Webhook: Orden ${updatedOrder._id} actualizada a 'succeeded'. Procediendo a sumar balance.`);
          // sumar saldo al usuario solo si la orden se actualizó correctamente
          await updateUserBalance(userId, amountPaidInCents);
          req.log.info({ userId: userId, amountAdded: amountPaidInCents }, `Webhook: Saldo del usuario ${userId} actualizado con ${amountPaidInCents} centavos.`);
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
        
        return reply
          .status(500)
          .send("Error interno del servidor al procesar el webhook.");
      }
      break;
   
    default:
      console.log(`Evento Stripe no manejado: ${event.type}`);
  }

  
  reply.send();
}

export const getUserBalance = async (request, reply) => {
  const userId = request.user?.id; 

  if (!userId) {
    return reply.status(401).send({ message: 'No autorizado' });
  }

  const balanceInCents = await getTotalAmountByUserId(userId);
  return { balance: balanceInCents / 100 };
};

