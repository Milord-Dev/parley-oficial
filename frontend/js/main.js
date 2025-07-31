// /frontend/js/main.js
(() => {
    const DashboardModule = (() => {
        const API_BASE_URL = 'http://localhost:3000';
        const htmlElements = {
            eventsContainer: document.getElementById('events-container'),
            sportCategoryHeaders: document.querySelectorAll('.sport-category__header'),
            mainContentTitle: document.querySelector('.main-content .content-title h2'), // Seleccionar el h2 dentro de .content-title
            mainContentIcon: document.querySelector('.main-content .content-title .sport-icon-img'), // Seleccionar la imagen dentro de .content-title
            sportCategoryLists: document.querySelectorAll('.sport-category__list') // Nuevos elementos para las listas de ligas
        };

        const methods = {

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
                    const homeOdds = event.main_moneyline_odds?.outcomes?.find(o => o.name === event.home_team)?.price || 'N/A';
                    const awayOdds = event.main_moneyline_odds?.outcomes?.find(o => o.name === event.away_team)?.price || 'N/A';
                    const drawOdds = event.main_moneyline_odds?.outcomes?.find(o => o.name === 'Draw')?.price || 'N/A';

                    const eventDate = new Date(event.commence_time);
                    const formattedDate = eventDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                    const formattedTime = eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                    eventsHtml += `
                    <div class="event-card">
                        <div class="event-info">
                            <div class="event-info__league">${event.sport_title || 'Liga Desconocida'}</div>
                            <div class="event-info__teams">${event.home_team} <br> VS <br> ${event.away_team}</div>
                            <div class="event-info__time">${formattedDate} - ${formattedTime}</div>
                        </div>
                        <div class="event-markets">
                            <div class="market-group">
                                <div class="market-title">Ganador</div>
                                <div class="bet-options">
                                    <button class="bet-btn" data-team="${event.home_team}">${homeOdds}</button>
                                    ${drawOdds !== 'N/A' ? `<button class="bet-btn" data-team="Draw">${drawOdds}</button>` : ''}
                                    <button class="bet-btn" data-team="${event.away_team}">${awayOdds}</button>
                                </div>
                            </div>
                            <button class="bet-btn bet-btn--more">+18</button>
                        </div>
                    </div>
                    `;
                });
                htmlElements.eventsContainer.innerHTML = eventsHtml;
            },

            // Obtiene los eventos de la API y los renderiza
            // Ahora acepta un sport_key para filtrar
            fetchAndRenderEvents: async (sport_key = null) => {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.log('No hay token, redirigiendo al login.');
                    window.location.href = '/frontend/pages/login.html';
                    return;
                }

                try {
                    let url = `${API_BASE_URL}/api/v1/events`;
                    if (sport_key) {
                        url += `?sport_key=${sport_key}`; // Usamos sport_key como query param
                    }

                    console.log(`Fetching events from: ${url}`); // Log para depuración

                    const response = await fetch(url, {
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
            },

            // Función para manejar el toggle del sidebar
            setupSportCategoryToggle: () => {
                htmlElements.sportCategoryHeaders.forEach(header => {
                    // Evitamos añadir el listener si ya existe uno por setupSportCategoryClick
                    // Este listener es solo para el toggle visual
                    header.addEventListener('click', (event) => {
                        // Asegurarse de que el clic no proviene de una liga específica dentro de la lista
                        if (event.target.tagName === 'LI') {
                            return; // No hacer toggle si clicamos en la liga
                        }
                        const sportCategory = header.closest('.sport-category');
                        const list = sportCategory.querySelector('.sport-category__list');
                        const arrow = header.querySelector('span:last-child');

                        header.classList.toggle('active');
                        list.classList.toggle('hidden');

                        if (list.classList.contains('hidden')) {
                            arrow.textContent = '▼';
                        } else {
                            arrow.textContent = '▲';
                        }
                    });
                });
            },

            // Nueva función para manejar el clic en los encabezados de deportes Y en las ligas
            setupSportCategoryClick: () => {
                // A. Listener para los encabezados de los deportes (para filtrar por deporte general)
                htmlElements.sportCategoryHeaders.forEach(header => {
                    header.addEventListener('click', (event) => {
                        // Si el clic viene de un LI dentro de la lista, ignoramos este listener
                        if (event.target.tagName === 'LI' || event.target.closest('ul.sport-category__list')) {
                            return;
                        }

                        const sportNameSpan = header.querySelector('span:first-child');
                        const sportIconImg = sportNameSpan.querySelector('.sport-icon-img');
                        // Extraer solo el texto del deporte, sin el icono
                        const sportText = sportNameSpan.childNodes[2] ? sportNameSpan.childNodes[2].textContent.trim() : sportNameSpan.textContent.trim();
                        let iconSrc = sportIconImg ? sportIconImg.src : '';

                        let sport_key;
                        switch (sportText) {
                            case 'Fútbol':
                                sport_key = 'soccer'; // General para fútbol
                                break;
                            case 'Básquetbol':
                                sport_key = 'basketball'; // General para básquetbol
                                break;
                            case 'Beisbol':
                                sport_key = 'baseball'; // General para béisbol
                                break;
                            case 'Tenis':
                                sport_key = 'tennis'; // General para tenis
                                break;
                            default:
                                sport_key = null; // Cargar todos si no se reconoce
                        }

                        if (htmlElements.mainContentTitle) {
                            htmlElements.mainContentTitle.textContent = sportText;
                        }
                        if (htmlElements.mainContentIcon && iconSrc) {
                            htmlElements.mainContentIcon.src = iconSrc;
                        }

                        methods.fetchAndRenderEvents(sport_key);
                    });
                });

                // B. Listener para los elementos de la lista de ligas (para filtrar por liga específica)
                htmlElements.sportCategoryLists.forEach(list => {
                    list.addEventListener('click', (event) => {
                        if (event.target.tagName === 'LI') {
                            const selectedLi = event.target;
                            const sport_key = selectedLi.dataset.sportKey; // Obtener el sport_key del data-atributo
                            const leagueName = selectedLi.dataset.leagueName; // Obtener el nombre de la liga

                            // Actualizar el título y el icono del contenido principal
                            // Puedes buscar el icono del deporte padre si quieres, o usar uno genérico
                            const parentSportCategory = selectedLi.closest('.sport-category');
                            const parentSportIconImg = parentSportCategory.querySelector('.sport-icon-img');
                            const iconSrc = parentSportIconImg ? parentSportIconImg.src : '';


                            if (htmlElements.mainContentTitle) {
                                htmlElements.mainContentTitle.textContent = leagueName; // Mostrar el nombre de la liga
                            }
                            if (htmlElements.mainContentIcon && iconSrc) {
                                htmlElements.mainContentIcon.src = iconSrc;
                            }

                            // Llamar a fetchAndRenderEvents con el sport_key específico de la liga
                            methods.fetchAndRenderEvents(sport_key);

                            // Opcional: Cerrar el acordeón después de seleccionar una liga
                            const sportCategory = selectedLi.closest('.sport-category');
                            const header = sportCategory.querySelector('.sport-category__header');
                            const list = sportCategory.querySelector('.sport-category__list');
                            const arrow = header.querySelector('span:last-child');

                            header.classList.remove('active');
                            list.classList.add('hidden');
                            arrow.textContent = '▼';
                        }
                    });
                });
            }
        };

        return {
            init: () => {
                methods.fetchAndRenderEvents(); // Carga inicial (todos los eventos)
                methods.setupSportCategoryToggle(); // Configura el toggle visual
                methods.setupSportCategoryClick(); // Configura los clics para filtrar
            }
        };

    })();

    document.addEventListener('DOMContentLoaded', DashboardModule.init);
})();