// /Backend/src/controllers/events.controller.js

// **Importaciones: Una sola vez al principio del archivo.**
// Importamos las funciones necesarias del servicio de la API de Odds.
// 'getUpcomingEventsWithOdds' es la que va a la API externa y guarda los datos.
// 'getActiveEventsFromDB' es la que consulta tu propia base de datos.
import { getActiveEventsFromDB, getUpcomingEventsWithOdds } from '../services/odd-api.service.js';

// **Definición de getEvents: Una sola vez.**
// Controlador para obtener los eventos desde la base de datos
// Ahora acepta un 'sport_key' como query parameter para filtrar los resultados.
export const getEvents = async (request, reply) => {
    try {
        // Obtenemos el sport_key de los query parameters (ej. /api/v1/events?sport_key=soccer_epl)
        // Si no se proporciona, sport_key será 'undefined' y el servicio lo manejará como 'null'.
        const { sport_key } = request.query; 
        
        // Llamamos al servicio para obtener los eventos, pasándole el sport_key
        const events = await getActiveEventsFromDB(sport_key); 
        
        return reply.send(events);
    } catch (error) {
        request.log.error(error); // Registrar el error en los logs del servidor
        return reply.status(500).send({ message: 'Error al obtener los eventos.', error: error.message });
    }
};

// **Definición de syncEventsWithOddsAPI: Una sola vez.**
// Controlador para forzar la sincronización con The Odds API.
// Este endpoint es útil para actualizar manualmente los eventos en tu base de datos.
// Opcionalmente, puedes pasar parámetros de query como 'sport', 'regions', etc.
export const syncEventsWithOddsAPI = async (request, reply) => {
    try {
        // Extraemos los parámetros de query que podrían venir en la URL
        // Por ejemplo: /api/v1/events/sync?sport=soccer_epl&regions=us
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
            
            // Añade aquí cualquier otro sport_key que te interese sincronizar por defecto
        ];

        // Usamos Promise.all para hacer las llamadas a la API de forma concurrente,
        // lo que es más eficiente que esperar una por una.
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