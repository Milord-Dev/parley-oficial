import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import authRoutes from './src/routes/auth.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import { connectDB } from './src/config/db.js';


// variables de entorno
dotenv.config();

const app = Fastify({
  logger: true, 
});

//CORS para permitir peticiones del frontend
app.register(cors, {
  origin: '*', 
});

// --- rutas del fastify (ejemplo)---
    app.register(authRoutes, { 
        prefix: '/api/v1/auth' 
    });

app.register(paymentsRoutes, {
    prefix: '/api/v1/'  
});

app.get('/api/v1/health', (request, reply) => {
  reply.send({ status: 'OK', message: 'El servidor backend está funcionando' });
});


const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;

    await connectDB();
    // iniciar el servidor para que escuche peticiones
    await app.listen({ port: PORT, host: '0.0.0.0' });
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();