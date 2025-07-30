import User from '../models/user.js';

export const updateUserBalance = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Usuario no encontrado');

  user.balance = (user.balance || 0) + amount;
  await user.save();
};
