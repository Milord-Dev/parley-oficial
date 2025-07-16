(() => {
const App = {
    htmlElements: {
        header: document.getElementById("header"),
        footer: document.getElementById("footer"),
    },

    init() {
        App.methods.loadComponent("header", App.htmlElements.header, App.methods.highlightActiveNav);
        App.methods.loadComponent("footer", App.htmlElements.footer);
    },

    methods: {
        loadComponent(componentName, targetElement, callback) {
            fetch(`../components/${componentName}.html`)
                .then(response => response.text())
                .then(html => {
                    targetElement.innerHTML = html;
                    if (callback) callback(); 
                })
            .catch(err => console.error(`Error cargando ${componentName}:`, err));
        },

        highlightActiveNav() {
            const path = window.location.pathname;
            // Ejemplo: "/pages/apuestas.html"
            const currentPage = path.split("/").pop().replace(".html", "");
            // Ejemplo: "apuestas"

            const navLinks = document.querySelectorAll("nav a");
            navLinks.forEach(link => {
                if (link.dataset.page === currentPage) {
                    link.classList.add("font-semibold", "underline");
                }
            });
        },
    },
};

App.init();
})();
