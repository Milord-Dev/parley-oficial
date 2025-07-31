// backend/src/models/bets.js
import mongoose from 'mongoose';

const betSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia directa al usuario que hizo la apuesta
    required: true,
    index: true,
  },
  event: {
    type: String, // Usamos String porque el _id del evento es el ID de la API
    ref: 'Event', 
    required: true,
  },
  marketKey: {
    type: String, 
    required: true,
  },
  outcomeName: {
    type: String, 
    required: true,
  },
  // Guardamos la cuota en el momento de la apuesta.
  // Las cuotas en el evento pueden cambiar, pero la apuesta se cierra con esta
  odds: {
    type: Number,
    required: true,
  },
 
  amount: {
    type: Number,
    required: true,
    min: 1, // Mínimo 1 centavo
  },
  potentialWinnings: {
    type: Number, // En centavos
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost', 'cancelled'],
    default: 'pending',
    index: true,
  },
  // para saber si el resultado ya se ha procesado y el pago (si aplica) se ha realizado.
  isSettled: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true, // Para saber cuándo se creo la apuesta
});

const Bet = mongoose.model('Bet', betSchema);

export default Bet;