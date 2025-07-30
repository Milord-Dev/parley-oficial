import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
    // crear un transportador (el servicio que enviará el correo)
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
    });

    // definir las opciones del correo el destinatario, asunto, cuerpo
    const mailOptions = {
        from: `BetSlip <${process.env.EMAIL_USER}>`, // Quién envía el correo
        to: options.email, // A quien se le envia
        subject: options.subject, 
        html: options.html, //cuerpo del correo en formato HTML
    };

    // enviar el correo
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado exitosamente:', info.response);
    } catch (error) {
        console.error('Error al enviar el correo:', error);
    }
};

export default sendEmail;