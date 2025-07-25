import Fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import authRoutes from './src/routes/auth.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import eventsRoutes from './src/routes/events.routes.js';
import { connectDB } from './src/config/db.js';
import cron from 'node-cron';


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
    app.register(eventsRoutes,{
      prefix: '/api/v1/events'
    });


app.get('/api/v1/health', (request, reply) => {
  reply.send({ status: 'OK', message: 'El servidor backend está funcionando' });
});


const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;

    // Esto puede sincronizar los eventos programados cada hora 
    await connectDB();
    cron.schedule('0 * * * *', async () => {
      console.log('Iniciando sincronización de eventos...');
      try{
        const { getUpcomingEventsWithOdds } = await import('./src/services/odd-api.service.js');
        // Aqui podemos especificar mas los deportes o regiones o lo podemos dejar por defecto (lo mejor)
        await getUpcomingEventsWithOdds('soccer_epl', 'us');
        console.log('Sincronización de eventos completada.');
      }catch(syncError){
        console.error('Error durante la sincronización de eventos:', syncError.message);
      }
    });
    console.log('Cron job programado para sincronización de eventos cada hora.');
    // iniciar el servidor para que escuche peticiones
    await app.listen({ port: PORT, host: '0.0.0.0' });
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();