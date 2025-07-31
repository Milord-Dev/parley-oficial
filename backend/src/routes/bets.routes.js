import { createBet } from '../controllers/bets.controller.js';

async function betsRoutes(fastify, options) {
  // POST /api/v1/bets crear una nueva apuesta
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate] 
    },
    createBet
  );
  
  // eventualmente para ver el historial de apuestas del usuario
  // fastify.get('/', { preHandler: [fastify.authenticate] }, getUserBets);
}

export default betsRoutes;