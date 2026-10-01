import api from '../config/axios.js'; // Asegúrate de tener este archivo creado

export const loginService = async (email, password) => {
  try {
    const response = await api.post('/api/users/login', { email, password });
    return response.data; // Retorna { token, user }
  } catch (error) {
    throw new Error('Credenciales inválidas');
  }
};