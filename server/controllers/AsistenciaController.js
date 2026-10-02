import Asistencia from '../models/Asistencia.js';

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isWorkingDay = (value) => {
  const day = new Date(`${value}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
};

class AsistenciaController {
  async registrarAsistencia(req, res) {
    try {
      const { tipo_marca: attendanceType } = req.body ?? {};
      const validTypes = ['ENTRADA', 'SALIDA', 'INICIO_COLACION', 'FIN_COLACION'];
      const tipoMarca = typeof attendanceType === 'string'
        ? attendanceType.trim().toUpperCase()
        : '';
      const idUsuario = Number(req.user?.id);

      if (!Number.isInteger(idUsuario) || idUsuario <= 0 || !validTypes.includes(tipoMarca)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      const nuevaMarcacion = await Asistencia.registrar(idUsuario, tipoMarca);
      return res.status(201).json({
        success: true,
        message: `Registro de ${nuevaMarcacion.tipoMarca} exitoso`,
        data: nuevaMarcacion,
      });
    } catch (error) {
      console.error('Error al registrar asistencia:', error.code || error.message);
      if (error.code === 'ATTENDANCE_ENTRY_REQUIRED') {
        return res.status(409).json({
          error: 'No puedes registrar la salida sin haber marcado la entrada',
        });
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async obtenerReporteAtrasos(_req, res) {
    try {
      // RE-01: solo entradas posteriores a las 09:30:00.
      const report = await Asistencia.obtenerAtrasos();
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error al obtener reporte de atrasos:', error.code || error.message);
      return res.status(500).json({ error: 'No se pudo obtener el reporte de atrasos' });
    }
  }

  async obtenerReporteSalidasAnticipadas(_req, res) {
    try {
      // RE-02: solo salidas anteriores a las 17:30:00.
      const report = await Asistencia.obtenerSalidasAnticipadas();
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error al obtener reporte de salidas anticipadas:', error.code || error.message);
      return res.status(500).json({ error: 'No se pudo obtener el reporte de salidas anticipadas' });
    }
  }

  async obtenerReporteInasistencias(req, res) {
    try {
      const fecha = req.query?.date || new Date().toISOString().slice(0, 10);

      if (!isValidIsoDate(fecha)) {
        return res.status(400).json({
          error: 'La fecha debe tener el formato YYYY-MM-DD y ser válida',
        });
      }

      // RE-03 aplica únicamente a días laborables.
      if (!isWorkingDay(fecha)) {
        return res.status(200).json([]);
      }

      const report = await Asistencia.obtenerInasistencias(fecha);
      return res.status(200).json(report);
    } catch (error) {
      console.error('Error al obtener reporte de inasistencias:', error.code || error.message);
      return res.status(500).json({ error: 'No se pudo obtener el reporte de inasistencias' });
    }
  }

  // Compatibilidad con clientes que todavía usan /reports/:reportType.
  async obtenerReporte(req, res) {
    const handlers = {
      atrasos: this.obtenerReporteAtrasos,
      'salidas-anticipadas': this.obtenerReporteSalidasAnticipadas,
      inasistencias: this.obtenerReporteInasistencias,
    };
    const handler = handlers[req.params?.reportType];

    if (!handler) {
      return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }

    return handler.call(this, req, res);
  }
}

export default new AsistenciaController();
