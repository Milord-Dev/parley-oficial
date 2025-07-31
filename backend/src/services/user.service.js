import User from '../models/user.js';
import Payment from '../models/order.js';
import mongoose from 'mongoose';

export const updateUserBalance = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  user.balance = (user.balance || 0) + amount;
  await user.save();
};

export async function getTotalAmountByUserId(userId) {
  console.log('userId recibido:', userId);

  const orders = await Payment.find({}); // Solo para debug
  console.log('Órdenes encontradas:', orders.map(o => o.user_id.toString()));

  const result = await Payment.aggregate([
    {
      $match: { user_id: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$user_id',
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  console.log('Resultado agregación:', result);

  return result[0]?.totalAmount || 0;
}
