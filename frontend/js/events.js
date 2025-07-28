import { getEventsApi } from './api/events.api.js';

export const loadEvents = async () => {
    try{
        const events = await getEventsApi();
        const eventsContainer = document.getElementById('events-container'); // Asegúrate de tener un div con este ID en tu HTML

        if(events.length === 0){
            eventsContainer.innerHTML = '<p>No se encontraron eventos.</p>';
            return;
        }

        eventsContainer.innerHTML = ''; // Limpiar contenedor
        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.home_team} vs ${event.away_team}</h3>
                <p>Deporte: ${event.sport_title}</p>
                <p>Inicio: ${new Date(event.commence_time).toLocaleString()}</p>
                <div class="odds-info">
                    ${event.main_moneyline_odds ? 
                        event.main_moneyline_odds.outcomes.map(outcome => `
                            <button class="odd-button" data-event-id="${event.id}" data-outcome-name="${outcome.name}" data-price="${outcome.price}">
                                ${outcome.name}: ${outcome.price}
                            </button>
                        `).join('')
                        : '<p>Cuotas no disponibles</p>'}
                </div>
            `;
            eventsContainer.appendChild(eventCard);
        });

        // Agrega event listeners a los botones de cuotas para la selección de parley
        document.querySelectorAll('.odd-button').forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Apuesta seleccionada:', {
                    eventId: e.target.dataset.eventId,
                    outcomeName: e.target.dataset.outcomeName,
                    price: e.target.dataset.price
                });
                // Aquí llamarías a tu lógica de `bets.js` para añadir al parley
                // Por ejemplo: addBetToParley({ eventId, outcomeName, price });
            });
        });
    }catch(error){
        console.error('Failed to load events:', error);
        const eventsContainer = document.getElementById('events-container');
        eventsContainer.innerHTML = '<p>Error al cargar los eventos. Por favor, intente de nuevo más tarde.</p>';
    }
}

// Asegúrate de llamar a loadEvents cuando la página esté lista
// Por ejemplo, en tu main.js o directamente en el script de bets.html
// document.addEventListener('DOMContentLoaded', loadEvents);