(() => {
    const App = {
        //cambios dentro de esta clase para que no genere errores en las paginas de login y registro
        // No buscamos los elementos aquí, lo haremos dentro de init()
        async init() {
            // Buscamos los contenedores DESPUÉS de que la página ha cargado.
            const headerContainer = document.getElementById("header");
            const footerContainer = document.getElementById("footer");

            //Verificamos si los contenedores existen antes de usarlos.
            if (headerContainer) {
                await App.methods.loadComponent("header", headerContainer);
                App.methods.adaptHeader();
                App.methods.highlightActiveNav();
            }

            if (footerContainer) {
                await App.methods.loadComponent("footer", footerContainer);
            }
        },

        methods: {

            async loadComponent(componentName, targetElement) {
                try {
                    // Pide el archivo HTML al servidor.
                    const response = await fetch(`../components/${componentName}.html`);
                    // Si el servidor responde con un error 
                    if (!response.ok) {
                        throw new Error(`No se pudo cargar: ${componentName}`);
                    }

                    const html = await response.text();
                    targetElement.innerHTML = html;

                } catch (error) {
                    console.error(error);
                }
            },

            handleLogout() {
                localStorage.removeItem('authToken');
                window.location.href = '/frontend/pages/login.html';
            },

            adaptHeader() {
                const currentPage = window.location.pathname.split("/").pop();
                const profileLink = document.getElementById('header-profile-link');
                const logoutButton = document.getElementById('logout-button');

                // si estamos en la página de perfil, ocultamos el enlace "Perfil"
                if (currentPage === 'perfil.html' && profileLink) {
                    profileLink.style.display = 'none';
                }

                // siempre asignamos el evento al botón de logout del header
                if (logoutButton) {
                    logoutButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        App.methods.handleLogout();
                    });
                }
            },

            highlightActiveNav() {
                const path = window.location.pathname;
                const currentPage = path.split("/").pop().replace(".html", "");

                
                const navLinks = document.querySelectorAll("header nav a"); 
                navLinks.forEach(link => {

                    if (link.getAttribute("href").includes(currentPage)) {
                        link.classList.add("active-nav-link"); 
                    }
                });
            },
        },
    };

    // esperamos a que el DOM esté completamente cargado para ejecutar init()
    // esto asegura que todos los elementos HTML ya existan
    document.addEventListener("DOMContentLoaded", App.init);
})();