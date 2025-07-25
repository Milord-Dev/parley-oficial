import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // esto es solo para el dearrollo no deberia estar en produccion
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
};

export const verifyToken = (token) => {
    try{
        return jwt.verify(token, JWT_SECRET);
    }catch(error){
        // console.error('Token verification failed:', error.message);
        return null; // Token inválido o expirado
    }
};