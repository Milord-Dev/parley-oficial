(() => {
  const AuthModule = (() => {


    const API_BASE_URL = 'http://localhost:3000/api/v1/auth';
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');


    const displayMessage = (formElement, message, type) => {
      // Buscamos un div que esté justo despues del formulario
      const messageContainer = formElement.nextElementSibling;
      if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = type; // Asigna 'success' o 'error'
      }
    };


    const handleLoginSubmit = async (event) => {
      event.preventDefault(); // Evita que la página se recargue

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const payload = { email, password };

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }
        
        displayMessage(loginForm, data.message, 'success');

        // Esperamos 1.5 segundos y luego redirigimos al usuario.
        setTimeout(() => {
        window.location.href = 'main.html'; 
        }, 1500);

      } catch (error) {
        displayMessage(loginForm, error.message, 'error');
      }
    };

 
    const handleRegisterSubmit = async (event) => {
      event.preventDefault();

      // Obtenemos los datos manualmente

      const payload = {
        nombreCompleto: document.getElementById('nombre-completo').value,
        email: document.getElementById('email').value,
        fechaNacimiento: document.getElementById('fecha-nacimiento').value,
        direccion: document.getElementById('direccion').value,
        provincia: document.getElementById('provincia').value,
        telefono: document.getElementById('telefono').value,
        password: document.getElementById('password').value
      };
      
      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }
        
        displayMessage(registerForm, data.message, 'success');

      } catch (error) {
        displayMessage(registerForm, error.message, 'error');
      }
    };

    const init = () => {
      // Si estamos en la página de login 
      if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        console.log('Módulo de Login listo.');
      }
      
      // Si estamos en la página de registro
      if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        console.log('Módulo de Registro listo.');
      }
    };

    return {
      init
    };

  })();
  AuthModule.init();

})();