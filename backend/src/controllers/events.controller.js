import { getUpcomingEventsWithOdds, getActiveEventsFromDB } from "../services/odd-api.service.js";

// Controlador para obtener los eventos desde la base de datos 
export const getEvents = async (request, reply) => {
    try{
        const events = await getActiveEventsFromDB();// Obtenemos los eventos de la DB
        reply.send(events);
    }catch(error){ 
        request.log.error(error);
        reply.status(500).send({message:'Error al obtener los eventos', error: error.message});
    }
};
// OPCIONAL: Controlador para forzar la sincronización con The Odds API
// Solo para propósitos de prueba o administración
export const syncEventsWithOddsAPI = async (request, reply) => {
    try {
        // Podrías pasar parámetros de query como sport, regions, etc.
        const { sport, regions, markets, oddsFormat } = request.query;

        await getUpcomingEventsWithOdds(
            sport || 'soccer_epl', // Por defecto 'soccer_epl'
            regions || 'us',       // Por defecto 'us'
            markets || 'h2h',      // Por defecto 'h2h'
            oddsFormat || 'decimal' // Por defecto 'decimal'
        );
        reply.send({ message: 'Events synchronization initiated successfully.' });
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ message: 'Error syncing events with Odds API', error: error.message });
    }
};