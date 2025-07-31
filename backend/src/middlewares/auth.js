import { verifyToken } from '../utils/jwt.js'; // Importa la función para verificar el token

/**
    * Middleware para autenticar al usuario usando un token JWT.
    * @param {import('fastify').FastifyRequest} request - Objeto de solicitud de Fastify.
    * @param {import('fastify').FastifyReply} reply - Objeto de respuesta de Fastify.
    * @param {function} done - Función de callback para continuar con el siguiente middleware.
*/
export const authMiddleware = async(request,reply) => {
    try{
        // 1. Obtener el token de los encabezados de autorización
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Si no hay encabezado Authorization o no empieza con 'Bearer '
            return reply.status(401).send({ message: 'No authentication token provided or invalid format.' });
        }

        const token = authHeader.split(' ')[1]; // Extrae el token después de 'Bearer '

        // 2. Verificar el token
        const decoded = verifyToken(token);

        if (!decoded) {
            // Si el token es inválido o ha expirado
            return reply.status(401).send({ message: 'Invalid or expired token.' });
        }

        // 3. Adjuntar la información del usuario al objeto request
        request.user = { id: decoded.userId }; // Asegúrate de que 'userId' coincida con lo que pones en el token

        // 4. Continuar con la solicitud (llamar al siguiente hook o controlador)
    } catch (error) {
        request.log.error(error); // Registrar el error para depuración
        reply.status(500).send({ message: 'Internal server error during authentication.' });
    }
};
