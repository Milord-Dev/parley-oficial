// models/order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkout_session_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },

  status: { 
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'], // Estados posibles de una orden
    default: 'pending', // Estado inicial al crear la orden
    required: true
  },

  created_at: {
    type: Date,
    default: Date.now,
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
