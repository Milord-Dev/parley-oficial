// backend/src/services/bets.service.js
import mongoose from 'mongoose';
import Bet from '../models/bets.js';
import User from '../models/user.js';
import { Event } from '../models/events.js';

export const placeBetService = async (betData) => {
  const { userId, eventId, marketKey, outcomeName, odds, amount } = betData;

  // Iniciamos una sesión para la transacción
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // validar que el evento existe y no ha comenzado
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      throw new Error('El evento no existe.');
    }
    if (new Date(event.commence_time) < new Date()) {
      throw new Error('No se puede apostar en un evento que ya ha comenzado.');
    }

    //obtener el usuario y verificar su saldo (dentro de la transacción)
    // Usamos `findOne` y `session` para bloquear el documento del usuario durante la transacción
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
    if (user.balance < amount) {
      throw new Error('Saldo insuficiente.');
    }

    // Deducir el monto del saldo del usuario
    user.balance -= amount;
    await user.save({ session });

    // Calcular ganancias potenciales (en centavos)
    const potentialWinnings = Math.round(amount * odds);

    // documento de la apuesta
    const newBet = new Bet({
      user: userId,
      event: eventId,
      marketKey,
      outcomeName,
      odds,
      amount,
      potentialWinnings,
    });
    await newBet.save({ session });
    
    // si todo fue bien confirmamos la transacción
    await session.commitTransaction();
    
    console.log(`Apuesta creada con éxito para el usuario ${userId}`);
    return { success: true, bet: newBet, newBalance: user.balance };

  } catch (error) {
    // Si algo falla, revertimos todos los cambios
    await session.abortTransaction();
    console.error('Error al realizar la apuesta, transacción revertida:', error.message);
    throw error; // Propagamos el error para que el controlador lo maneje

  } finally {
    session.endSession();
  }
};