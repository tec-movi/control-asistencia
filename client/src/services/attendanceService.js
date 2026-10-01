import api from '../config/axios.js';

export const markAttendanceService = async (userId, type) => {
  const response = await api.post('/api/attendance', { id_usuario: userId, tipo_marca: type.toUpperCase() });
  return response.data;
};

export const getReportsService = async (reportType, date) => {
  const response = await api.get(`/api/attendance/reports/${reportType}`, {
    params: date ? { date } : undefined,
  });
  return response.data;
};