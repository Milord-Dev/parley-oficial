import User from '../models/user.js';
import bcrypt from 'bcrypt';

export default async function userRoutes(fastify, opts) {
  // Ruta protegida que devuelve los datos del usuario autenticado
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return reply.code(404).send({ message: 'Usuario no encontrado' });
      }

      return user;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Error al obtener el perfil del usuario' });
    }
  });

  // Ruta para actualizar datos del perfil del usuario
  fastify.put('/update', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const { nombre, telefono, oldPassword, newPassword } = request.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return reply.code(404).send({ message: 'Usuario no encontrado' });
      }

      // Verificar contraseña anterior
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        return reply.code(400).send({ message: 'Contraseña antigua incorrecta' });
      }

      // Actualizar campos si vienen
      if (nombre) user.nombre = nombre;
      if (telefono) user.telefono = telefono;
      if (newPassword) user.password = await bcrypt.hash(newPassword, 10);

      await user.save();

      reply.send({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ message: 'Error al actualizar el perfil del usuario' });
    }
  });
}
