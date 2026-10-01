import api from '../config/axios.js'; // Asegúrate de tener este archivo creado

export const loginService = async (email, password) => {
  const response = await api.post('/api/users/login', { email, password });
  return response.data;
};