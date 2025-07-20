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

      const nombreCompleto = document.getElementById('nombre-completo').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const repeatPassword = document.getElementById('repetir-password').value;
      const fechaNacimiento = document.getElementById('fecha-nacimiento').value;
      const telefono = document.getElementById('telefono').value.trim();
      
      
      // verifica que sean solo números y entre 7 y 15 dígitos (telefono)
      const phoneRegex = /^\d{7,15}$/;

      // Validación básica 

      if (nombreCompleto.length < 3) {
        displayMessage(registerForm, 'El nombre debe tener al menos 3 caracteres.', 'error');
        return;
      }

      if (password.value !== repeatPassword.value) {
          displayMessage(registerForm, 'Las contraseñas no coinciden.', 'error');
          return;
      }

      if (password.length < 6) {
        displayMessage(registerForm, 'La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
      }

      if (password !== repeatPassword) {
        displayMessage(registerForm, 'Las contraseñas no coinciden.', 'error');
        return;
      }

      if (telefono && !phoneRegex.test(telefono)) {
        displayMessage(registerForm, 'El número de teléfono solo debe contener entre 7 a 15 caracteres .', 'error');
        return;
      }

      const payload = {
        nombreCompleto,
        email,
        fechaNacimiento,
        password,
        telefono
      };
      
      try {

        displayMessage(registerForm, 'Procesando...', 'success');

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

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);

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