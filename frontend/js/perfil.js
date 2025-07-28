(() => {
    const ProfileModule = (() => {

        const API_BASE_URL = 'http://localhost:3000';
        const htmlElements = {
            addFundsButton: document.querySelector('.AgregarFondos'),
            usernameDisplay: document.getElementById('profile-username'),
            userIdDisplay: document.getElementById('profile-userid'),
            balanceDisplay: document.getElementById('profile-balance'),
            profileLogoutButton: document.querySelector('.btnCerrarSesion')
        };
        
        const methods = {

            handleLogout: () => {
                  localStorage.removeItem('authToken');
                  window.location.href = '/frontend/pages/login.html';
              },


            setupEventListeners: () => {
                if (htmlElements.addFundsButton) {
                    htmlElements.addFundsButton.addEventListener('click', methods.handleAddFunds);
                }
                if (htmlElements.profileLogoutButton) {
                    htmlElements.profileLogoutButton.addEventListener('click', methods.handleLogout);
                }
            },
            
            //Llena la página con los datos del usuario obtenidos de la API. 
            renderProfile: (user) => {
                if (htmlElements.usernameDisplay) {
                    htmlElements.usernameDisplay.textContent = user.nombreCompleto;
                }
                if (htmlElements.userIdDisplay) {
                    htmlElements.userIdDisplay.textContent = `User ID: ${user._id}`;
                }
                if (htmlElements.balanceDisplay) {
                    const formattedBalance = (user.balance / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    });
                    htmlElements.balanceDisplay.textContent = formattedBalance;
                }
            },

            //para buscar los datos del usuario logeado y desplegarlo
            fetchProfileData: async (token) => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('No se pudieron cargar los datos del perfil.');
                    
                    const userData = await response.json();
                    methods.renderProfile(userData);
                } catch (error) {
                    console.error(error);
                    if (htmlElements.usernameDisplay) {
                        htmlElements.usernameDisplay.textContent = 'Error al cargar';
                    }
                }
            },
            
            //Maneja el clic para crear una sesión de pago con Stripe.
             
            handleAddFunds: async () => {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Sesión expirada. Inicia sesión de nuevo.');
                    window.location.href = '/frontend/pages/login.html';
                    return;
                }
                try {
                    const response = await fetch(`${API_BASE_URL}/api/v1/payments/create-checkout-session`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Error al crear sesión de pago.');
                    if (data.url) window.location.href = data.url;
                } catch (error) {
                    console.error('Error con Stripe:', error);
                    alert(error.message);
                }
            }
        };

        return {
            init: () => {
                // pararoteger la página
                const token = localStorage.getItem('authToken');
                if (!token) {
                    window.location.href = '/frontend/pages/login.html';
                    return;
                }
     
                // Si la protección pasa cargar los datos y configurar los botones
                methods.fetchProfileData(token);
                methods.setupEventListeners();
            }
        };
    })();

    document.addEventListener('DOMContentLoaded', ProfileModule.init);
})();