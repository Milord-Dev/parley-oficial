(() => {
    const DashboardModule = (() => {
        const API_BASE_URL = 'http://localhost:3000';
        const htmlElements = {
            eventsContainer: document.getElementById('events-container'),
        };

        const methods = {

            handleLogout: () => {
                console.log('Cerrando sesión');
                localStorage.removeItem('authToken');
                window.location.href = '/frontend/pages/login.html';
            },

            renderEvents: (events) => {
                if (!htmlElements.eventsContainer) {
                    console.error("El contenedor #events-container no fue encontrado.");
                    return;
                }
                if (!events || events.length === 0) {
                    htmlElements.eventsContainer.innerHTML = '<p>No hay eventos disponibles en este momento.</p>';
                    return;
                }

                let eventsHtml = '';
                events.forEach(event => {
                    eventsHtml += `
                    <div class="event-card">
                        <div class="event-info">
                            <div class="event-info__league">${event.league || 'N/A'}</div>
                            <div class="event-info__teams">${event.home_team} <br> VS <br> ${event.away_team}</div>
                        </div>
                        <div class="event-markets">
                        <div class="market-group">
                            <div class="market-title">Ganador</div>
                            <div class="bet-options">
                                <button class="bet-btn">1</button>
                                <button class="bet-btn">X</button>
                                <button class="bet-btn">2</button>
                            </div>
                        </div>
                        <div class="market-group">
                            <div class="market-title">1x2</div>
                            <div class="bet-options">
                                <button class="bet-btn">1</button>
                                <button class="bet-btn bet-btn--selected">X</button>
                                <button class="bet-btn">2</button>
                            </div>
                        </div>
                        <div class="market-group">
                            <div class="market-title">Double chance</div>
                            <div class="bet-options">
                                <button class="bet-btn">1X</button>
                                <button class="bet-btn">12</button>
                                <button class="bet-btn">X2</button>
                            </div>
                        </div>
                        <button class="bet-btn bet-btn--more">+18</button>
                    </div>
                </div>
                    `;
                });
                htmlElements.eventsContainer.innerHTML = eventsHtml;
            },


            setupEventListeners: () => {
                document.body.addEventListener('click', (event) => {
                    // Si el elemento en el que se hizo clic tiene el id 'logout-button'
                    if (event.target && event.target.id === 'logout-button') {
                        event.preventDefault(); // Previene cualquier acción por defecto del enlace
                        methods.handleLogout();
                    }
                });
            },

            // Obtiene los eventos de la API 

            fetchAndRenderEvents: async () => {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.log('No hay token, redirigiendo al login.');
                    window.location.href = '/frontend/pages/login.html';
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.status === 401) {
                        localStorage.removeItem('authToken');
                        window.location.href = '/frontend/pages/login.html';
                        return;
                    }

                    if (!response.ok) {
                        throw new Error('Error al obtener los eventos del servidor.');
                    }

                    const eventsData = await response.json();
                    methods.renderEvents(eventsData);

                } catch (error) {
                    console.error(error);
                    if (htmlElements.eventsContainer) {
                        htmlElements.eventsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
                    }
                }
            }
        };

        return {
            init: () => {
                methods.setupEventListeners();
                methods.fetchAndRenderEvents();
            }
        };

    })();

    document.addEventListener('DOMContentLoaded', DashboardModule.init);
})();