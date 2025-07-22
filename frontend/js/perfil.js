document.querySelector('.AgregarFondos').addEventListener('click', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/v1/payments/create-checkout-session', {
      method: 'POST',
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirige a Stripe
    }
  } catch (error) {
    alert('Error al conectar con Stripe');
    console.error(error);
  }
});
