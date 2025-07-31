// /frontend/js/main.js
(() => {
    const DashboardModule = (() => {
        const API_BASE_URL = 'http://localhost:3000';
        const htmlElements = {
            eventsContainer: document.getElementById('events-container'),
            sportCategoryHeaders: document.querySelectorAll('.sport-category__header'),
            mainContentTitle: document.querySelector('.main-content .content-title h2'), // Seleccionar el h2 dentro de .content-title
            mainContentIcon: document.querySelector('.main-content .content-title .sport-icon-img'), // Seleccionar la imagen dentro de .content-title
            sportCategoryLists: document.querySelectorAll('.sport-category__list'), // Nuevos elementos para las listas de ligas
            
            //eventos para el 'boleto de apuesta'
            betSlipContainer: document.getElementById('bet-slip-container'),
            betSlipContent: document.getElementById('bet-slip-content'),
            betSlipForm: document.getElementById('bet-slip-form'),
            betAmountInput: document.getElementById('bet-amount'),
            potentialWinningsEl: document.getElementById('potential-winnings'),
            placeBetBtn: document.getElementById('place-bet-btn'),
            betSlipMessage: document.getElementById('bet-slip-message'),

        };

        let currentBetSelection = null;

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
                    const h2hOdds = event.main_moneyline_odds;
                    
                    // Verificaciones más seguras para las cuotas
                    const homeOutcome = h2hOdds?.outcomes?.find(o => o.name === event.home_team);
                    const awayOutcome = h2hOdds?.outcomes?.find(o => o.name === event.away_team);
                    const drawOutcome = h2hOdds?.outcomes?.find(o => o.name === 'Draw');

                    const formattedDate = new Date(event.commence_time).toLocaleString('es-ES', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    });

                    // Genera los botones de apuesta solo si las cuotas existen, de lo contrario muestra 'N/A'
                    const betButtonsHtml = homeOutcome && awayOutcome ? `
                        <button class="bet-btn" data-market-key="h2h" data-outcome-name="${homeOutcome.name}" data-odds="${homeOutcome.price}">1: ${homeOutcome.price}</button>
                        ${drawOutcome ? `<button class="bet-btn" data-market-key="h2h" data-outcome-name="${drawOutcome.name}" data-odds="${drawOutcome.price}">X: ${drawOutcome.price}</button>` : ''}
                        <button class="bet-btn" data-market-key="h2h" data-outcome-name="${awayOutcome.name}" data-odds="${awayOutcome.price}">2: ${awayOutcome.price}</button>
                    ` : '<div class="no-odds">Cuotas no disponibles</div>';

                    eventsHtml += `
                    <div class="event-card" 
                        data-event-id="${event._id}"
                        data-home-team="${event.home_team}"  
                         data-away-team="${event.away_team}"  
                    >
                        <div class="event-info">
                            <div class="event-info__league">${event.sport_title || 'Liga'}</div>
                            <div class="event-info__teams">${event.home_team} <br> VS <br> ${event.away_team}</div>
                            <div class="event-info__time">${formattedDate}</div>
                        </div>
                        <div class="event-markets">
                            <div class="market-group">
                                <div class="market-title">Ganador</div>
                                <div class="bet-options">
                                    ${betButtonsHtml}
                                </div>
                            </div>
                            <button class="bet-btn bet-btn--more">+18</button>
                        </div>
                    </div>
                    `;
                });
                htmlElements.eventsContainer.innerHTML = eventsHtml;
            },

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

                    const result = await response.json();


                    if (!result.success) { // Si el backend indica un fallo
                        throw new Error(result.message || 'Error desconocido al procesar eventos.');
                    }

                    methods.renderEvents(result.data);

                } catch (error) {
                    console.error(error);
                    if (htmlElements.eventsContainer) {
                        htmlElements.eventsContainer.innerHTML = `<p style="color:red;">${error.message}</p>`;
                    }
                }
            },

            //se reemplaza el toogle y se unicfca con el category click 
            setupSportCategoryClick: () => {
                const handleSelection = (element, isLeague) => {
                    const sport_key = element.dataset.sportKey;
                    const name = isLeague ? element.dataset.leagueName : element.querySelector('span:first-child').textContent.trim();
                    const iconSrc = element.closest('.sport-category').querySelector('.sport-icon-img').src;

                    if (htmlElements.mainContentTitle) htmlElements.mainContentTitle.textContent = name;
                    if (htmlElements.mainContentIcon) htmlElements.mainContentIcon.src = iconSrc;

                    methods.fetchAndRenderEvents(sport_key);
                };

                htmlElements.sportCategoryLists.forEach(list => {
                    list.addEventListener('click', (event) => {
                        if (event.target.tagName === 'LI') {
                            handleSelection(event.target, true);
                        }
                    });
                });
            },

            //Maneja el clic en un botón de apuesta de una tarjeta de evento.
            handleBetButtonClick: (event) => {
                const betButton = event.target.closest('.bet-btn');
                if (!betButton || !betButton.dataset.marketKey){
                    return;
                } 

                const eventCard = betButton.closest('.event-card');
                
                // Añade una verificación por si no se encuentra la tarjeta del evento (aunque no debería pasar si el botón es clicable)
                if (!eventCard) {
                    console.error("Error: No se encontró el elemento '.event-card' padre del botón de apuesta.");
                    return;
                }

                currentBetSelection = {
                    eventId: eventCard.dataset.eventId,
                    marketKey: betButton.dataset.marketKey,
                    outcomeName: betButton.dataset.outcomeName,
                    odds: parseFloat(betButton.dataset.odds),
                    homeTeam: eventCard.dataset.homeTeam,
                    awayTeam: eventCard.dataset.awayTeam,
                };
                
                methods.updateBetSlipUI();
            },
            
            //Actualiza la interfaz del boleto de apuesta basado en la selección actual.
            updateBetSlipUI: () => {
                if (currentBetSelection) {
                    
                    htmlElements.betSlipContainer.classList.remove('hidden');

                    htmlElements.betSlipContent.innerHTML = `
                        <div class="bet-slip-selection">
                            <p class="teams">${currentBetSelection.homeTeam} vs ${currentBetSelection.awayTeam}</p>
                            <p>Tu selección: <strong class="market">${currentBetSelection.outcomeName}</strong></p>
                            <p>Cuota: <strong class="odds">${currentBetSelection.odds.toFixed(2)}</strong></p>
                        </div>
                    `;
                    htmlElements.betSlipForm.classList.remove('hidden');
                    htmlElements.betAmountInput.value = '';
                    htmlElements.potentialWinningsEl.textContent = '$0.00';
                    htmlElements.placeBetBtn.disabled = true;
                } else {
                    htmlElements.betSlipContent.innerHTML = '<p class="empty-slip-message">Selecciona una cuota para comenzar.</p>';
                    htmlElements.betSlipForm.classList.add('hidden');
                    htmlElements.betSlipContainer.classList.add('hidden');
                }
                methods.clearMessage();
            },
            
            //Calcula y muestra las ganancias potenciales a medida que el usuario escribe el monto
            calculateWinnings: () => {
                const amount = parseFloat(htmlElements.betAmountInput.value);
                if (!amount || amount <= 0 || !currentBetSelection) {
                    htmlElements.potentialWinningsEl.textContent = '$0.00';
                    htmlElements.placeBetBtn.disabled = true;
                    return;
                }
                const potential = (amount * currentBetSelection.odds).toFixed(2);
                htmlElements.potentialWinningsEl.textContent = `€${potential}`;
                htmlElements.placeBetBtn.disabled = false;
            },
            
            //Envía la apuesta al backend.
            placeBet: async () => {
                if (!currentBetSelection || htmlElements.placeBetBtn.disabled) return;

                const amountInCents = Math.round(parseFloat(htmlElements.betAmountInput.value) * 100);

                if (isNaN(amountInCents) || amountInCents <= 0) {
                    methods.showMessage('Por favor, ingresa un monto válido.', 'error');
                    htmlElements.placeBetBtn.disabled = false;
                    htmlElements.placeBetBtn.textContent = 'Realizar Apuesta';
                    return;
                }
                
                const token = localStorage.getItem('authToken');
                htmlElements.placeBetBtn.disabled = true;
                htmlElements.placeBetBtn.textContent = 'Procesando...';

                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/bets`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            eventId: currentBetSelection.eventId,
                            marketKey: currentBetSelection.marketKey,
                            outcomeName: currentBetSelection.outcomeName,
                            odds: currentBetSelection.odds,
                            amount: amountInCents,
                        }),
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || 'Error desconocido');
                    
                    methods.showMessage('¡Apuesta realizada con éxito!', 'success');
                    
                    // Si tienes una función para actualizar el saldo en el header, llámala aquí.
                    // Por ejemplo: updateHeaderBalance(result.newBalance);
                    
                    currentBetSelection = null;
                    setTimeout(() => {
                        methods.updateBetSlipUI();
                    }, 2000); // Resetea el boleto después de 2 segundos

                } catch (error) {
                    methods.showMessage(error.message, 'error');
                } finally {
                    htmlElements.placeBetBtn.disabled = false;
                    htmlElements.placeBetBtn.textContent = 'Realizar Apuesta';
                }
            },
            
            /*Muestra un mensaje de exito o error en el área de mensajes del boleto
             message - El mensaje a mostrar
             type - success o error
             */
            showMessage: (message, type) => {
                htmlElements.betSlipMessage.textContent = message;
                htmlElements.betSlipMessage.className = `bet-slip-message ${type}`;
            },

            //Limpia el área de mensajes del boleto
            clearMessage: () => {
                htmlElements.betSlipMessage.textContent = '';
                htmlElements.betSlipMessage.className = 'bet-slip-message';
            }
        };

        return {
            init: () => {
                methods.fetchAndRenderEvents(); // Carga inicial (todos los eventos)
                methods.setupSportCategoryToggle(); // Configura el toggle visual
                
                methods.setupSportCategoryClick();
                htmlElements.eventsContainer.addEventListener('click', methods.handleBetButtonClick);
                htmlElements.betAmountInput.addEventListener('input', methods.calculateWinnings);
                htmlElements.placeBetBtn.addEventListener('click', methods.placeBet);

                // Estado inicial del boleto
                methods.updateBetSlipUI();
            }
        };

    })();

    document.addEventListener('DOMContentLoaded', DashboardModule.init);
})();