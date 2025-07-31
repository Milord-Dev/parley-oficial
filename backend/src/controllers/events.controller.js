import { getActiveEventsFromDB, getUpcomingEventsWithOdds } from '../services/odd-api.service.js';
import { formatResponse } from '../utils/format.js';

export const getEvents = async (request, reply) => {
    try {
        const { sport_key } = request.query; 

        // Llamamos al servicio para obtener los eventos, pasándole el sport_key
        const events = await getActiveEventsFromDB(sport_key); 
        
        reply.send(formatResponse(true, 'Eventos obtenidos con éxito', events));
    } catch (error) {
        request.log.error(error); // Registrar el error en los logs del servidor
        return reply.status(500).send({ message: 'Error al obtener los eventos.', error: error.message });
    }
};

export const syncEventsWithOddsAPI = async (request, reply) => {
    try {
        // Extraemos los parámetros de query que podrían venir en la URL
        const { sport, regions, markets, oddsFormat } = request.query;

        // Si se especificó un deporte en la URL, sincronizamos solo ese.
        if (sport) {
            await getUpcomingEventsWithOdds(
                sport,
                regions || 'us',
                markets || 'h2h',
                oddsFormat || 'decimal'
            );
            return reply.status(200).send({ message: `Eventos para ${sport} sincronizados correctamente.` });
        }

        // Si NO se especificó un deporte, sincronizamos una lista predefinida de deportes.
        const sportsToSync = [
            'soccer_epl',
            'soccer_uefa_champs_league', // Confirma este sport_key
            'basketball_nba',
            'baseball_mlb',
            'tennis',
            
            
        ];

        // Usamos Promise.all para hacer las llamadas a la API de forma concurrente
       
        const syncPromises = sportsToSync.map(s => 
            getUpcomingEventsWithOdds(s, 'us', 'h2h', 'decimal')
        );
        await Promise.all(syncPromises); // Espera a que todas las sincronizaciones terminen
        
        return reply.status(200).send({ message: 'Todos los deportes predefinidos sincronizados correctamente.' });

    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Error al sincronizar eventos con The Odds API', error: error.message });
    }
};