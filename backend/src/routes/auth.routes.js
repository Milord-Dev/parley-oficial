import User from '../models/user.js'; 
import bcrypt from 'bcrypt';         
import { generateToken } from '../utils/jwt.js';
import crypto from 'crypto';
import sendEmail from '../utils/email.js'; 

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
    //nueva ruta para parte de reseteo de contraseña 
    fastify.post('/forgotpassword', async (request, reply) => {
        // la lógica para encontrar al usuario y generar el token es la misma
        const { email } = request.body;
        const user = await User.findOne({ email });

        if (!user) {
            return reply.send({ message: 'Si el correo está registrado, recibirás un enlace...' });
        }

        //generar resetToken, hashearlo y guardarlo en el usuario
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // preparamos y enviamos el correo real 
        const resetUrl = `http://127.0.0.1:5500/frontend/pages/reset-password.html?token=${resetToken}`;
        
        // Creamos un cuerpo con html
        const emailBody = `
            <h1>Has solicitado restablecer tu contraseña</h1>
            <p>Por favor, haz clic en el siguiente enlace para establecer una nueva contraseña. Este enlace expirará en 10 minutos.</p>
            <a href="${resetUrl}" clicktracking="off" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
            <p>Si no solicitaste esto, por favor ignora este correo.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Restablecimiento de Contraseña - BetSlip',
                html: emailBody
            });

            reply.send({ message: 'Se ha enviado un enlace a tu correo.' });

        } catch (error) {
            // en caso de errorlimpiamos el token de la BD para que el usuario pueda intentarlo de nuevo.
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            
            fastify.log.error('Error al enviar el correo de reseteo', error);
            return reply.status(500).send({ message: 'No se pudo enviar el correo. Inténtalo de nuevo más tarde.' });
        }
    });

    fastify.put('/resetpassword/:resettoken', async (request, reply) => {
            try {
                
                const resettoken = request.params.resettoken;
                const hashedToken = crypto.createHash('sha256').update(resettoken).digest('hex');
                const user = await User.findOne({
                    resetPasswordToken: hashedToken,
                    //asigna un tiempo limite de expiracion para reiniciar la contraseña 
                    resetPasswordExpire: { $gt: Date.now() }
                });

                if (!user) {
                    return reply.status(400).send({ message: 'El enlace es inválido o ha expirado.' });
                }
                
                // Si el token es válido establecemos la nueva contraseña
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(request.body.password, salt);
                
                // Limpiamos los campos de reseteo
                user.resetPasswordToken = undefined;
                user.resetPasswordExpire = undefined;

                await user.save();
                reply.send({ message: 'Contraseña actualizada exitosamente.' });

            } catch (error) {
                fastify.log.error(error);
                reply.status(500).send({ message: 'Error interno del servidor.' });
            }
        });
}

export default authRoutes;