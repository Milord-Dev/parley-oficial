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

    let currentUserId = null;

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

      renderProfile: async (user) => {
        currentUserId = user._id;

        if (htmlElements.usernameDisplay) {
          htmlElements.usernameDisplay.textContent = user.nombreCompleto;
        }

        if (htmlElements.userIdDisplay) {
          htmlElements.userIdDisplay.textContent = `User ID: ${user._id}`;
        }

        // Obtener el balance real desde el backend
        await methods.fetchUserBalance();
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
          await methods.renderProfile(userData);
        } catch (error) {
          console.error(error);
          if (htmlElements.usernameDisplay) {
            htmlElements.usernameDisplay.textContent = "Error al cargar";
          }
        }
      },

   fetchUserBalance: async () => {
        const token = localStorage.getItem("authToken");
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/v1/payments/balance`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            throw new Error("No se pudo obtener el balance.");
          }

          // CAMBIO AQUÍ: Desestructura 'balance'
          const { balance } = await response.json(); // Ahora esperas { balance: X }

          if (htmlElements.balanceDisplay) {
            // Usa 'balance' directamente, ya que ya es el totalAmount
            const formattedBalance = balance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            });
            htmlElements.balanceDisplay.textContent = formattedBalance;
          }
        } catch (error) {
          console.error("Error al obtener el balance:", error);
          if (htmlElements.balanceDisplay) {
            htmlElements.balanceDisplay.textContent = "$0.00"; // Mostrar 0.00 en caso de error
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
        const totalAmount  = parseFloat(amountInput.value);
        if (isNaN(totalAmount ) || totalAmount  <= 0) {
          alert("Por favor, ingresa un monto válido.");
          return;
        }

        const amountInCents = Math.round(totalAmount  * 100);

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
                userId: currentUserId,
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
