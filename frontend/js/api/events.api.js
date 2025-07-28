const BASE_URL = 'http://localhost:3000/api/v1'; // Reemplaza con la URL de tu backend en producción

export const getEventsApi = async () => {
    try{
        // Suponiendo que tienes un token JWT guardado en localStorage después del login
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/events`,{
            method:'GET',
            headers:{
                'Content-Type': 'application/json',
                // Incluir el token de autenticación si la ruta está protegida
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if(!response.ok){
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los eventos');
        }
        const data = await response.json();
        return data;

    }catch(error){
        console.error('Error al obtener los eventos:', error);
        throw error;
    }
};