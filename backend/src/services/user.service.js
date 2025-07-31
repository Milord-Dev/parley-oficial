import User from '../models/user.js';
import Payment from '../models/order.js';
import mongoose from 'mongoose';

export const updateUserBalance = async (userId, amountInCents) => {

  console.log(`[updateUserBalance] Iniciando para userId: ${userId}, añadiendo: ${amountInCents} centavos.`);
  
  const user = await User.findById(userId);
  
  if (!user) {
    console.error(`[updateUserBalance] ERROR: Usuario no encontrado con userId: ${userId}`);
    throw new Error('Usuario no encontrado'); // Lanza error para que se vea en el controlador
  }

  const oldBalance = user.balance || 0; // Asegurarse de que el balance inicial sea 0 si es null/undefined
  user.balance = oldBalance + amountInCents;

  console.log(`[updateUserBalance] Usuario encontrado. Saldo anterior: ${oldBalance}, Saldo nuevo calculado: ${user.balance}`);

  try {
    await user.save(); // Intenta guardar el usuario
    console.log(`[updateUserBalance] ÉXITO: Saldo del usuario ${userId} guardado correctamente. Saldo final en DB: ${user.balance}`);
  } catch (saveError) {
    console.error(`[updateUserBalance] ERROR: Fallo al guardar el balance para userId: ${userId}. Error:`, saveError);

    if (saveError.name === 'ValidationError') {
        console.error(`[updateUserBalance] Detalle del ValidationError:`, saveError.errors);
    }
    throw saveError; 
  }

  return user.balance; // Devuelve el nuevo balance en centavos
};

export async function getTotalAmountByUserId(userId) {
  console.log('userId recibido:', userId);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('ID de usuario inválido.');
  }

  const result = await Payment.aggregate([
    {
      $match: { user_id: new mongoose.Types.ObjectId(userId), 
                status: 'succeeded'
      }
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
