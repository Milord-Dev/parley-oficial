(() => {
  const ProfileModule = (() => {
    const API_BASE_URL = "http://localhost:3000";

    const htmlElements = {
      addFundsButton: document.querySelector(".AgregarFondos"),
      usernameDisplay: document.getElementById("profile-username"),
      userIdDisplay: document.getElementById("profile-userid"),
      balanceDisplay: document.getElementById("profile-balance"),
      profileLogoutButton: document.querySelectorAll(".btnCerrarSesion"),
    };

    let currentUserId = null; // Almacenamos el ID del usuario para usarlo en el pago

    const methods = {
      handleLogout: () => {
        localStorage.removeItem("authToken");
        window.location.href = "/frontend/pages/login.html";
      },

      setupEventListeners: () => {
        if (htmlElements.addFundsButton) {
          htmlElements.addFundsButton.addEventListener(
            "click",
            methods.handleAddFunds
          );
        }
        if (htmlElements.profileLogoutButton.length > 0) {
          htmlElements.profileLogoutButton.forEach((btn) => {
            btn.addEventListener("click", methods.handleLogout);
          });
        }
      },

      renderProfile: (user) => {
        currentUserId = user._id; // Guardamos el userId para luego usarlo en el pago

        if (htmlElements.usernameDisplay) {
          htmlElements.usernameDisplay.textContent = user.nombreCompleto;
        }

        if (htmlElements.userIdDisplay) {
          htmlElements.userIdDisplay.textContent = `User ID: ${user._id}`;
        }

        if (htmlElements.balanceDisplay) {
          const formattedBalance = (user.balance / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          });
          htmlElements.balanceDisplay.textContent = formattedBalance;
        }
      },

      fetchProfileData: async (token) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error("No se pudieron cargar los datos del perfil.");
          }

          const userData = await response.json();
          methods.renderProfile(userData);
        } catch (error) {
          console.error(error);
          if (htmlElements.usernameDisplay) {
            htmlElements.usernameDisplay.textContent = "Error al cargar";
          }
        }
      },

      handleAddFunds: async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("Sesión expirada. Inicia sesión de nuevo.");
          window.location.href = "/frontend/pages/login.html";
          return;
        }

        const amountInput = document.getElementById("amount-input");
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
          alert("Por favor, ingresa un monto válido.");
          return;
        }

        const amountInCents = Math.round(amount * 100);

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/v1/payments/create-checkout-session`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: amountInCents,
                userId: currentUserId, // Enviamos el userId al backend
              }),
            }
          );

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Error al crear sesión de pago.");
          }

          if (data.url) {
            window.location.href = data.url;
          }
        } catch (error) {
          console.error("Error con Stripe:", error);
          alert(error.message);
        }
      },
    };

    return {
      init: () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
          window.location.href = "/frontend/pages/login.html";
          return;
        }

        methods.fetchProfileData(token);
        methods.setupEventListeners();
      },
    };
  })();

  document.addEventListener("DOMContentLoaded", ProfileModule.init);
})();
