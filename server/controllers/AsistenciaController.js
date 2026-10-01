import Asistencia from '../models/Asistencia.js';

class AsistenciaController {
  async registrarAsistencia(req, res) {
    try {
      const { id_usuario, tipo_marca } = req.body;
      
      const validTypes = ['ENTRADA', 'SALIDA', 'INICIO_COLACION', 'FIN_COLACION'];
      const normalizedType = typeof tipo_marca === 'string' ? tipo_marca.trim().toUpperCase() : '';
      const userId = req.user?.id ? Number(req.user.id) : Number(id_usuario);

      if (!Number.isInteger(userId) || userId <= 0 || !validTypes.includes(normalizedType)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      // 1. Aquí aplicarías la lógica de "buscarUsuarioActivoPorCookie" si usaras cookies.
      // Como usamos React, confiamos en el id_usuario que viene en el req.body (previamente validado por el token).

      // 2. Llamamos al método que inserta en DB y nos devuelve el objeto instanciado
      const nuevaMarcacion = await Asistencia.registrar(userId, normalizedType);
      
      // Devolvemos el objeto creado al frontend
      res.status(201).json({ 
        success: true, 
        message: `Registro de ${nuevaMarcacion.tipoMarca} exitoso`,
        data: nuevaMarcacion 
      });
    } catch (error) {
      console.error("Error en asistencia:", error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }

  }

  async obtenerReporte(req, res) {
    try {
      const { reportType } = req.params;
      const reportDate = req.query?.date;
      const reporters = {
        atrasos: () => Asistencia.obtenerAtrasos(),
        'salidas-anticipadas': () => Asistencia.obtenerSalidasAnticipadas(),
        inasistencias: () => Asistencia.obtenerInasistencias(reportDate || new Date().toISOString().slice(0, 10)),
      };

      if (!Object.hasOwn(reporters, reportType)) {
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
      }

      if (reportType === 'inasistencias' && reportDate && !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
        return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD' });
      }

      const report = await reporters[reportType]();
      res.status(200).json(report);
    } catch (error) {
      console.error('Error al obtener reporte:', error.code || error.message);
      res.status(500).json({ error: 'No se pudo obtener el reporte' });
    }
  }
}

export default new AsistenciaController();