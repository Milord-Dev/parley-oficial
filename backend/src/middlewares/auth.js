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
        // Asumiendo que tu token JWT contiene el ID del usuario en el payload.
        // Por ejemplo, si al generar el token hiciste generateToken({ userId: user._id })
        request.user = { id: decoded.userId }; // Asegúrate de que 'userId' coincida con lo que pones en el token

        // 4. Continuar con la solicitud (llamar al siguiente hook o controlador)
    } catch (error) {
        request.log.error(error); // Registrar el error para depuración
        reply.status(500).send({ message: 'Internal server error during authentication.' });
    }
    // En Fastify, si una función preHandler es async, no necesitas llamar a done() explícitamente si no hay errores.
    // Simplemente al terminar sin lanzar error, Fastify continuará.
};


// Opcional: Middleware para verificar si el usuario es administrador
// Necesitarías consultar la base de datos para verificar el rol del usuario
/*
export const authorizeAdmin = async (request, reply) => {
    try {
        // Asume que request.user.id ya está disponible por el middleware de autenticación
        if (!request.user || !request.user.id) {
            return reply.status(403).send({ message: 'Unauthorized: User not authenticated.' });
        }

        // Aquí deberías consultar tu base de datos para obtener el rol del usuario
        // Ejemplo (necesitarías importar tu modelo de usuario):
        // import { User } from '../models/user.js';
        // const user = await User.findById(request.user.id);
        // if (!user || user.role !== 'admin') {
        //     return reply.status(403).send({ message: 'Forbidden: Admin access required.' });
        // }

        // Si el usuario es administrador, continúa
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ message: 'Internal server error during authorization.' });
    }
};
*/