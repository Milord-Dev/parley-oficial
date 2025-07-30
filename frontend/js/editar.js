// Cargar los datos actuales al abrir la página
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return window.location.href = '/frontend/pages/login.html';

  try {
    const res = await fetch('http://localhost:3000/api/v1/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) return window.location.href = '/frontend/pages/login.html';

    const user = await res.json();
    document.getElementById('nombre-completo').placeholder = user.nombreCompleto || '';
    document.getElementById('telefono').placeholder = user.telefono || '';

  } catch (err) {
    console.error('Error cargando datos del usuario', err);
  }
});

// Enviar los cambios al hacer submit
document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('authToken');
  if (!token) return alert('Sesión expirada. Inicia sesión de nuevo.');

  const nombre = document.getElementById('nombre-completo').value;
  const telefono = document.getElementById('telefono').value;
  const oldPassword = document.getElementById('old-password').value;
  const newPassword = document.getElementById('new-password').value;
  const repetirPassword = document.getElementById('repetir-password').value;

  if (newPassword && newPassword !== repetirPassword) {
    alert('Las contraseñas nuevas no coinciden.');
    return;
  }

  const payload = {};
  if (nombre) payload.nombreCompleto = nombre;
  if (telefono) payload.telefono = telefono;
  if (oldPassword && newPassword) {
    payload.oldPassword = oldPassword;
    payload.newPassword = newPassword;
  }

  try {
    const res = await fetch('http://localhost:3000/api/v1/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Error al actualizar');
      return;
    }

    alert('Perfil actualizado correctamente');
    window.location.href = '/frontend/pages/perfil.html'; // Redirigir al perfil

  } catch (err) {
    console.error(err);
    alert('Error del servidor');
  }
});