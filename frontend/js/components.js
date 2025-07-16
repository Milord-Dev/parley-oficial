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
                    const response = await fetch(`/components/${componentName}.html`);
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