import User from '../models/user.js'; 
import bcrypt from 'bcrypt';         
import { generateToken } from '../utils/jwt.js';


async function authRoutes(fastify, options) {

  //Ruta: POST /api/v1/auth/register
   
    fastify.post('/register', async (request, reply) => {
        try {
            const { nombreCompleto, email, password, fechaNacimiento, telefono } = request.body;

            // checkar si el usuario ya existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return reply.status(409).send({ 
                    message: 'El email ya está en uso.' 
                });
            }

            // hasheamos la contraseña
            const salt = await bcrypt.genSalt(10); // genera una "sal" para el hash
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = new User({
                nombreCompleto,
                email,
                password: hashedPassword, // Guardamos la contraseña hasheada
                fechaNacimiento,
                telefono
            });

            // guardar el usuario en la base de datos
            await newUser.save();

            // noenviamos la contraseña de vuelta ni siquiera la hasheada.
            return reply.status(201).send({ 
                message: 'Usuario registrado exitosamente.',
                user: { id: newUser._id, email: newUser.email }
            });

        } catch (error) {
            console.error('Error en el registro:', error);
            return reply.status(500).send({ message: 'Error interno del servidor.' });
        }
    });

    fastify.post('/login', async (request, reply) => {
       try {
            const { email, password } = request.body;

            // buscar al usuaurio por su email
            const user = await User.findOne({ email });
            if (!user) {
                return reply.status(401).send({ message: 'Credenciales inválidas.' });
            }

            // comparar la contraseña enviada con la hasheada en la BD
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return reply.status(401).send({ message: 'Credenciales inválidas.' });
            }

            //usamos la funcion de modoulo de utilidades
            const payload = {
                id: user._id,
                email: user.email,
                nombre: user.nombreCompleto
            }

            const token = generateToken(payload);

            return reply.send ({
                message: 'Login exitoso',
                token: token, 
                user: { id: user._id, email: user.email, nombre: user.nombreCompleto }
            });

        } catch (error) {
            console.error('Error en el login:', error);
            return reply.status(500).send({ message: 'Error interno del servidor.' });
        }
    });
}

export default authRoutes;