(() => {
  const AuthModule = (() => {


    const API_BASE_URL = 'http://localhost:3000';
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');


    const methods = {
          checkSession: () =>{
            const token = localStorage.getItem('authToken');
            if(token){
              console.log('Usuario ya logueado. Redirigiendo al dashboard');
              window.location.href = '/frontend/pages/main.html'
              return true;
            }
              return false; 
          },

          displayMessage: (formElement, message, type) => {
            //buscamos el contenedor de mensajes dentro del mismo contenedor padre del formulario
            const wrapper = formElement.parentElement;
            if (wrapper) {
                const messageContainer = wrapper.querySelector('.message-container');
                if (messageContainer) {
                    messageContainer.textContent = message;
                    messageContainer.classList.remove('success', 'error');
                  //Añadimos un pequeño retardo para que el navegador note el cambio y aplique la transición si la hubiera.
                    setTimeout(() => {
                    messageContainer.classList.add(type);
                  }, 10);
                }
            }
          }
    };
    const handlers = {

      handleLoginSubmit: async (event) => {
          event.preventDefault(); // Evita que la página se recargue

          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          const payload = { email, password };

          try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message);
            }
            
            if(data.token){
              localStorage.setItem ('authToken', data.token);
            }

            methods.displayMessage(loginForm, data.message, 'success');

            // Esperamos 1.5 segundos y luego redirigimos al usuario.
            setTimeout(() => {
            window.location.href = 'main.html'; 
            }, 1500);

          } catch (error) {
            methods.displayMessage(loginForm, error.message, 'error');
          }
        },

        handleRegisterSubmit: async (event) => {
          event.preventDefault();

          const nombreCompleto = document.getElementById('nombre-completo').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const repeatPassword = document.getElementById('repetir-password').value;
          const fechaNacimiento = document.getElementById('fecha-nacimiento').value;
          const telefono = document.getElementById('telefono').value.trim();
          
          
          //Funcion para calcular la edad del usuario

          const getAge = (birthDateString) => {
          const today = new Date();
          const birthDate = new Date(birthDateString);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDifference = today.getMonth() - birthDate.getMonth();
              
          // Si no ha pasado el cumpleaños de este año, se resta 1
              if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
              }
              return age;
          };

          if (!fechaNacimiento) {
              methods.displayMessage(registerForm, 'La fecha de nacimiento es obligatoria.', 'error');
              return;
          }
          
          const userAge = getAge(fechaNacimiento);
          if (userAge < 18) {
              methods.displayMessage(registerForm, 'Debes ser mayor de 18 años para registrarte.', 'error');
              return;
          }

          // verifica que sean solo números y entre 7 y 15 dígitos (telefono)
          const phoneRegex = /^\d{7,15}$/;

          // Validación básica 

          if (nombreCompleto.length < 3) {
            methods.displayMessage(registerForm, 'El nombre debe tener al menos 3 caracteres.', 'error');
            return;
          }

          if (password.value !== repeatPassword.value) {
              methods.displayMessage(registerForm, 'Las contraseñas no coinciden.', 'error');
              return;
          }

          if (password.length < 6) {
            methods.displayMessage(registerForm, 'La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
          }

          if (password !== repeatPassword) {
            methods.displayMessage(registerForm, 'Las contraseñas no coinciden.', 'error');
            return;
          }

          if (telefono && !phoneRegex.test(telefono)) {
            methods.displayMessage(registerForm, 'El número de teléfono solo debe contener entre 7 a 15 caracteres .', 'error');
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

            methods.displayMessage(registerForm, 'Procesando...', 'success');

            const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message);
            }
            
            methods.displayMessage(registerForm, data.message, 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);

          } catch (error) {
            methods.displayMessage(registerForm, error.message, 'error');
          }
        },

        handleForgotPasswordSubmit: async (event) => {
          event.preventDefault();
          const email = document.getElementById('email').value;
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgotpassword`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
              const data = await response.json();
              methods.displayMessage(forgotPasswordForm, data.message, 'success');
            } catch (error) {
                methods.displayMessage(forgotPasswordForm, 'Error al conectar con el servidor.', 'error');
            }
        },

        handleResetPasswordSubmit: async (event) => {
          event.preventDefault();
          const newPassword = document.getElementById('password').value;
          // Extraer el token de la URL
          const urlParams = new URLSearchParams(window.location.search);
          const resetToken = urlParams.get('token');

            if (!resetToken) {
                methods.displayMessage(resetPasswordForm, 'Token no encontrado en la URL.', 'error');
                return;
            }
        
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/resetpassword/${resetToken}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                methods.displayMessage(resetPasswordForm, data.message, 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } catch (error) {
                methods.displayMessage(resetPasswordForm, error.message, 'error');
            }
        }

    };
        return {
          init: () => { // no necesita ser async en este caso
                const isRedirecting = methods.checkSession();
                if (isRedirecting){
                  return;
                } 

                const setupForm = (form, handler) => {
                    if (form) {
                        form.reset(); // Limpia el formulario en la carga inicial
                        form.addEventListener('submit', handler);
                    }
                }
                setupForm(loginForm, handlers.handleLoginSubmit);
                setupForm(registerForm, handlers.handleRegisterSubmit);
                setupForm(forgotPasswordForm, handlers.handleForgotPasswordSubmit);
                setupForm(resetPasswordForm, handlers.handleResetPasswordSubmit);

                window.addEventListener('pageshow', (event) => {
                  //event.persisted es true si la página se restaura desde la bfcache
                if (event.persisted) {
                      console.log('Página restaurada desde cache, limpiando form');
                      if (loginForm) {
                        loginForm.reset();
                      }
                      if (registerForm){
                        registerForm.reset();
                      } 
                }
              });
            }
        };
  })();
  AuthModule.init();

})();