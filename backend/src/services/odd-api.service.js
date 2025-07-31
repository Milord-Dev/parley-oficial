import axios from 'axios';
import dotenv from 'dotenv';
import { Event } from '../models/events.js'; // Esto va a importar el modelo del event.js
import { isWithinInterval, addHours, addDays } from 'date-fns'; // Para manejar el tiempo de los eventos

dotenv.config();

const ODDS_API_KEY = process.env.ODDS_API_KEY || process.env.API_KEY; 

// Asegúrate de que en tu .env, la variable se llame EXACTAMENTE 'ODDS_API_BASE_URL'.
const ODDS_API_BASE_URL = process.env.ODDS_API_BASE_URL;

// Función para obtener los deportes disponibles
export const getSports = async () => {
    try {
        if (!ODDS_API_KEY) {
            console.error('ERROR: No se encontró la API Key (ODDS_API_KEY/API_KEY) para The Odds API.');
            throw new Error('API Key de The Odds API no configurada.');
        }
        if (!ODDS_API_BASE_URL) {
            console.error('ERROR: No se encontró la URL Base de The Odds API (ODDS_API_BASE_URL).');
            throw new new Error('URL Base de The Odds API no configurada.');
        }
        const response = await axios.get(`${ODDS_API_BASE_URL}/v4/sports/?apiKey=${ODDS_API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los deportes:', error.message);
        if (axios.isAxiosError(error)) { // Verifica si es un error de Axios
            if (error.response) {
                console.error('Detalles del error de la API (getSports):', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('No se recibió respuesta del servidor de la API (getSports).');
                console.error('Datos de la petición (getSports):', error.request);
            } else {
                console.error('Error de configuración de Axios o de red (getSports):', error.message);
            }
        } else {
            console.error('Error inesperado (getSports):', error);
        }
        throw new Error('Error al obtener los deportes');
    }
};

// Función principal para obtener los eventos y cuotas
export const getUpcomingEventsWithOdds = async (sport = 'soccer_epl', regions = 'us', markets = 'h2h', oddsFormat = 'decimal') => {
    if (!ODDS_API_KEY) {
        console.error('ERROR: No se encontró la API Key (ODDS_API_KEY/API_KEY) para The Odds API al intentar sincronizar eventos.');
        throw new Error('API Key de The Odds API no configurada.');
    }
    if (!ODDS_API_BASE_URL) {
        console.error('ERROR: No se encontró la URL Base de The Odds API (ODDS_API_BASE_URL) para sincronizar eventos.');
        throw new Error('URL Base de The Odds API no configurada.');
    }

    const url = `${ODDS_API_BASE_URL}/v4/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
    console.log(`[SYNC - ${sport}] Intentando obtener datos de: ${url}`); // LOG 1: URL de la petición

    try {
        const response = await axios.get(url);
        
        console.log(`[SYNC - ${sport}] Respuesta HTTP Status: ${response.status}`); // LOG 2: Status HTTP
        
        const eventData = response.data;
        console.log(`[SYNC - ${sport}] Recibidos ${eventData.length} eventos para procesar.`); // LOG 3: Cantidad de eventos recibidos

        if (eventData.length === 0) {
            console.log(`[SYNC - ${sport}] No hay eventos para este deporte en este momento. Saltando el procesamiento.`);
            return { success: true, message: `No hay eventos para ${sport}.` };
        }

        // Procesar y guardar o actualizar los eventos en tu base de datos.
        for (const event of eventData) {

            console.log(`[SYNC] Procesando evento de API: ${event.id} - ${event.home_team} vs ${event.away_team}`);
            // Buscamos si el evento existe para actualizarlo o crearlo
            const existingEvent = await Event.findOne({ id: event.id });

            let mainOdds = null;
            let foundH2hMarket = null;

            if (event.bookmakers && event.bookmakers.length > 0) {
                for (const bookmaker of event.bookmakers) {
                    // Solo si bookmaker.markets existe y es un array
                    if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
                        foundH2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
                        if (foundH2hMarket) {
                            console.log(`[SYNC] Encontrado mercado H2H del bookmaker: ${bookmaker.title}`);
                            break;
                        }
                    }
                }
            }

            if (foundH2hMarket) {
                // Asegurarse de que outcomes existe antes de mapear
                if (foundH2hMarket.outcomes && Array.isArray(foundH2hMarket.outcomes)) {
                    mainOdds = {
                        key: foundH2hMarket.key,
                        last_update: new Date(foundH2hMarket.last_update),
                        outcomes: foundH2hMarket.outcomes.map(outcome => ({
                            name: outcome.name,
                            price: outcome.price,
                            point: outcome.point // Puede ser undefined si no aplica
                        }))
                    };
                     console.log(`[SYNC] Cuotas H2H construidas para guardar:`, JSON.stringify(mainOdds.outcomes));
                } else {
                    console.warn(`[SYNC - ${sport}] Evento ${event.id}: Mercado 'h2h' encontrado pero sin 'outcomes'.`);
                }
            } else {
                console.warn(`[SYNC - ${sport}] Evento ${event.id}: No se encontró mercado 'h2h' en ningún bookmaker.`);
            }

            const now = new Date();
            const commenceTime = new Date(event.commence_time);

            const isRelevantTime = isWithinInterval(commenceTime, {
                start: addDays(now, -30),
                end: addDays(now, 30)
            });


            if (existingEvent) {
                existingEvent.main_moneyline_odds = mainOdds;
                existingEvent.last_odds_update = new Date();
                await existingEvent.save();
                console.log(`[SYNC - ${sport}] Evento ${event.id} (${event.home_team} vs ${event.away_team}) actualizado.`); // LOG 4: Evento actualizado
            } else if (isRelevantTime) {
                const newEvent = new Event({
                    id: event.id,
                    sport_key: event.sport_key,
                    sport_title: event.sport_title,
                    commence_time: event.commence_time,
                    home_team: event.home_team,
                    away_team: event.away_team,
                    main_moneyline_odds: mainOdds,
                    last_odds_update: new Date()
                });
                console.log(`[SYNC] Antes de guardar nuevo Evento ${event.id}. main_moneyline_odds será:`, JSON.stringify(mainOdds));
                await newEvent.save();
                console.log(`[SYNC - ${sport}] Nuevo evento ${event.id} (${event.home_team} vs ${event.away_team}) guardado.`); // LOG 5: Nuevo evento
            }
        }
        console.log(`[SYNC - ${sport}] Sincronización completa para ${sport}.`); // LOG 6: Sincronización exitosa
        return { success: true, message: `Sincronización de ${sport} completada.` };
    } catch (error) {
        console.error(`[SYNC - ${sport}] ERROR en getUpcomingEventsWithOdds:`); // LOG 7: Error general
        if (axios.isAxiosError(error)) { // Esto es para errores de Axios específicamente
            if (error.response) {
                // El error es una respuesta HTTP de la API (4xx, 5xx)
                console.error(`[SYNC - ${sport}] Error de la API: Status ${error.response.status}, Data:`, error.response.data);
                console.error(`[SYNC - ${sport}] Headers:`, error.response.headers);
                throw new Error(`Error de la API (${error.response.status}) al sincronizar ${sport}: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                // La petición se hizo pero no se recibió respuesta (ej. problema de red/timeout)
                console.error(`[SYNC - ${sport}] No se recibió respuesta del servidor de la API (Request made, no response).`);
                console.error(`[SYNC - ${sport}] Request data:`, error.request);
                throw new Error(`Error de red al sincronizar ${sport}.`);
            } else {
                // Algo más causó el error de Axios (ej. configuración, antes de enviar la petición)
                console.error(`[SYNC - ${sport}] Error en la configuración de Axios o red local: ${error.message}`);
                console.error(`[SYNC - ${sport}] Error Stack:`, error.stack);
                throw new Error(`Error interno de Axios al sincronizar ${sport}: ${error.message}`);
            }
        } else {
            // Otros errores no relacionados con Axios (ej. error en tu lógica de JS)
            console.error(`[SYNC - ${sport}] Mensaje de error interno (no Axios): ${error.message}`);
            console.error(`[SYNC - ${sport}] Error Stack:`, error.stack);
            throw new Error(`Error interno al procesar eventos para ${sport}: ${error.message}`);
        }
    }
};

// Una función para obtener los eventos ya guardados en tu DB que estén activos/próximos
export const getActiveEventsFromDB = async (sport_key = null) => { // Aceptar sport_key como parámetro
    try {
        const now = new Date();
        const startDate = addDays(now, -30);
        const endDate = addDays(now, 30);

        const query = {
            commence_time: {
                $gte: startDate,
                $lte: endDate
            }
        };

        // Si se proporciona un sport_key, añadirlo al filtro de la consulta
        if (sport_key) {
            query.sport_key = sport_key;
        }

        console.log(`Buscando eventos en DB con filtro:`, query); // Log para depuración

        const relevantEvents = await Event.find(query).sort({ commence_time: 1 });

        console.log(`Encontrados ${relevantEvents.length} eventos en la DB.`);

        return relevantEvents;
    } catch (error) {
        console.error('Error al obtener los eventos activos:', error.message);
        throw new Error('Error al obtener los eventos activos');
    }
};