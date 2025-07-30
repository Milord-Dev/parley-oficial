import User from '../models/user.js'; 

export default async function userRoutes(fastify, opts) {
  // Ruta protegida que devuelve los datos del usuario autenticado
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      // El usuario ya está verificado y decodificado, accesible en request.user
      const userId = request.user.id;

      // Buscar al usuario en la base de datos (ajusta según tu modelo)
      const user = await User.findById(userId).select('-password'); // omitimos contraseña

      if (!user) {
        return reply.code(404).send({ message: 'Usuario no encontrado' });
      }

      return user;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Error al obtener el perfil del usuario' });
    }
  });
}
