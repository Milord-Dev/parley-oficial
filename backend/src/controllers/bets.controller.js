import { placeBetService } from '../services/bets.service.js';
import { formatResponse } from '../utils/format.js';

export const createBet = async (request, reply) => {
  try {
  
    request.log.info({ jwtPayload: request.user }, 'Contenido del JWT payload (request.user)');
    // --- FIN DEPURACIÓN ---

    let userId;

    
    if (request.user && request.user.id) {
        userId = request.user.id;
    } 
    // Si no tiene 'id', intentamos con '_id' 
    else if (request.user && request.user._id) {
        userId = request.user._id;
    } 

    else if (request.user) { 
        userId = request.user;
    }


    if (!userId) {
        
        request.log.error({ requestUserContent: request.user }, 'Fallo al obtener el ID del usuario del token. Contenido de request.user.');
        throw new Error('No se pudo obtener el ID del usuario del token.');
    }
    
    
    request.log.info({ extractedUserId: userId }, 'ID de usuario extraído para la apuesta');

    const { eventId, marketKey, outcomeName, odds, amount } = request.body;

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents <= 0) {
      return reply.status(400).send(formatResponse(false, 'Monto de apuesta inválido.'));
    }

    const betData = {
      userId,
      eventId,
      marketKey,
      outcomeName,
      odds,
      amount: amountInCents,
    };

    const result = await placeBetService(betData);

    reply.status(201).send(formatResponse(true, 'Apuesta realizada con éxito', {
        bet: result.bet,
        newBalance: result.newBalance / 100
    }));

  } catch (error) {
    request.log.error(error, 'Error al crear apuesta');
    const statusCode = error.message.includes('Saldo insuficiente') ? 400 : 500;
    reply.status(statusCode).send(formatResponse(false, error.message || 'Error interno del servidor al crear apuesta.'));
  }
};