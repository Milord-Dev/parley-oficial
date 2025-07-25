// /Backend/src/services/odd-api.service.js

import axios from 'axios';
import dotenv from 'dotenv';
import { Event } from '../models/events.js'; // Esto va a importar el modelo del event.js
import { isWithinInterval, addHours, addDays } from 'date-fns'; // Para manejar el tiempo de los eventos

dotenv.config();

const API_KEY = process.env.API_KEY;
// Asegúrate de que en tu .env, la variable se llame EXACTAMENTE 'ODDS_API_BASE_URL'
// como te indiqué anteriormente, no 'BASE_URL', para evitar confusiones.
const ODDS_API_BASE_URL = process.env.ODDS_API_BASE_URL; // Corregido: debería ser ODDS_API_BASE_URL

// Función para obtener los deportes disponibles
export const getSports = async () => {
    try {
        // CORRECCIÓN: Usar template literal para la URL correctamente con backticks (`)
        const response = await axios.get(`${ODDS_API_BASE_URL}/v4/sports/?apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los deportes:', error.message);
        throw new Error('Error al obtener los deportes');
    }
};

// Función principal para obtener los eventos y cuotas
export const getUpcomingEventsWithOdds = async (sport = 'soccer_epl', regions = 'us', markets = 'h2h', oddsFormat = 'decimal') => {
    try {
        const url = `${ODDS_API_BASE_URL}/v4/sports/${sport}/odds?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}`;
        console.log(`Obteniendo probabilidades de: ${url}`); // CORRECCIÓN: Usar template literal

        const response = await axios.get(url);
        const eventData = response.data;

        // Procesar y guardar o actualizar los eventos en tu base de datos.
        for (const event of eventData) {
            // Buscamos si el evento existe para actualizarlo o crearlo
            const existingEvent = await Event.findOne({ id: event.id });

            // CORRECCIÓN: La estructura de la API es bookmakers -> markets -> outcomes
            // Buscamos el mercado 'h2h' dentro del array de 'markets' de CADA 'bookmaker'.
            // Tomamos el primer bookmaker que tenga el mercado h2h (o el primero en general si no hay h2h)
            // Y de ese bookmaker, tomamos el primer mercado h2h que encontremos.
            let mainOdds = null;
            let foundH2hMarket = null;

            if (event.bookmakers && event.bookmakers.length > 0) {
                for (const bookmaker of event.bookmakers) {
                    foundH2hMarket = bookmaker.markets.find(m => m.key === 'h2h'); // Buscamos el mercado 'h2h'
                    if (foundH2hMarket) {
                        break; // Encontramos el mercado en este bookmaker, salimos del bucle
                    }
                }
            }

            if (foundH2hMarket) {
                mainOdds = {
                    key: foundH2hMarket.key,
                    last_updated: new Date(foundH2hMarket.last_update), // Usar last_update según la API
                    outcomes: foundH2hMarket.outcomes.map(outcome => ({
                        name: outcome.name,
                        price: outcome.price,
                        point: outcome.point // Puede ser undefined si no aplica
                    }))
                };
            }

            // Filtramos eventos para guardar/actualizar:
            // Ampliamos el rango para incluir eventos del pasado cercano y futuro.
            const now = new Date();
            const commenceTime = new Date(event.commence_time);

            // Rango: desde 30 días en el pasado hasta 30 días en el futuro
            const isRelevantTime = isWithinInterval(commenceTime, {
                start: addDays(now, -30), // Eventos que comenzaron hasta 30 días atrás
                end: addDays(now, 30)     // Eventos que comienzan hasta 30 días en el futuro
            });


            if (existingEvent) {
                // Actualizar el evento existente, especialmente las cuotas
                existingEvent.main_moneyline_odds = mainOdds;
                existingEvent.last_odds_update = new Date(); // Actualizamos la marca de tiempo de la última actualización
                // PREGUNTA: ¿Puedes añadir lógica para actualizar otros campos si cambian?
                // RESPUESTA: Sí, si otros campos como 'home_team', 'away_team', 'commence_time', etc.,
                // pudieran cambiar en la API de Odds después de que los guardas, deberías incluirlos aquí.
                // Por ejemplo: existingEvent.commence_time = event.commence_time;
                // Para los datos de Odds API, generalmente solo las cuotas (odds) y last_update cambian con frecuencia.
                await existingEvent.save();
                // PREGUNTA: console.log(`Updated event: ${event.id}`); ¿Qué hace esto?
                // RESPUESTA: Esto imprime un mensaje en la CONSOLA de tu servidor backend. Es muy útil para
                // la depuración y para saber qué está haciendo tu código en segundo plano.
                // Te dirá, por ejemplo: "Updated event: abc12345"
                console.log(`Updated event: ${event.id}`);
            } else if (isRelevantTime) { // Solo creamos si no existe Y si es relevante por tiempo
                // Crear un nuevo evento si no existe y es relevante por tiempo
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
                await newEvent.save();
                // PREGUNTA: console.log(`Created new event: ${event.id}`); ¿Qué hace esto?
                // RESPUESTA: Similar al anterior, esto imprime un mensaje en la CONSOLA de tu servidor
                // indicando que un nuevo evento ha sido creado y guardado en la base de datos.
                // Te dirá, por ejemplo: "Created new event: def67890"
                console.log(`Created new event: ${event.id}`);
            }
        }
        console.log('Successfully fetched and processed events from Odds API.');
        // CORRECCIÓN: 'eventsData' no está definida aquí. Si necesitas devolver algo,
        // lo más útil es devolver los 'eventData' originales de la API o un mensaje de éxito.
        return eventData; // Retornamos los datos que obtuvimos de la API
    } catch (error) {
        console.error('Error al procesar los eventos:', error.message);
        if (error.response) {
            console.error('Error response from Odds API:', error.response.data);
            console.error('Error status:', error.response.status);
        }
        throw new Error('Error al procesar los eventos');
    }
};

// Una función para obtener los eventos ya guardados en tu DB que estén activos/próximos
export const getActiveEventsFromDB = async () => {
    try {
        const now = new Date();
        // MODIFICACIÓN: Rango ampliado para obtener eventos del pasado reciente y futuro lejano
        const startDate = addDays(now, -30); // Eventos desde 30 días atrás
        const endDate = addDays(now, 30);   // Eventos hasta 30 días en el futuro

        const relevantEvents = await Event.find({
            commence_time: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ commence_time: 1 }); // Ordenar por fecha de inicio
        return relevantEvents;
    } catch (error) {
        console.error('Error al obtener los eventos activos:', error.message);
        throw new Error('Error al obtener los eventos activos');
    }
};