import api from '../config/axios.js';

export const getUsersService = async () => (await api.get('/api/users')).data;
export const createUserService = async (data) => (await api.post('/api/users', data)).data;
export const updateUserService = async (id, data) => (await api.put(`/api/users/${id}`, data)).data;
export const deleteUserService = async (id) => (await api.delete(`/api/users/${id}`)).data;
export const activateUserService = async (id) => (await api.patch(`/api/users/${id}/activate`)).data;