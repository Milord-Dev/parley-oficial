import {getEvents, syncEventsWithOddsAPI} from '../controllers/events.controller.js';
import {authMiddleware} from '../middlewares/auth.js';

async function eventsRoutes(fastify,options){
    fastify.get('/',{
        preHandler: authMiddleware,
        handler: getEvents
    });
    
    fastify.post('/sync',{
        //preHandler: authMiddleware,
        handler: syncEventsWithOddsAPI
    });
}

export default eventsRoutes;