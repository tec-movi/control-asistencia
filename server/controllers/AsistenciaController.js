import Asistencia from '../models/Asistencia.js';

class AsistenciaController {
  async registrarAsistencia(req, res) {
    try {
      const { id_usuario, tipo_marca } = req.body;
      
      // Validación básica
      if (!id_usuario || !tipo_marca) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
      }

      // 1. Aquí aplicarías la lógica de "buscarUsuarioActivoPorCookie" si usaras cookies.
      // Como usamos React, confiamos en el id_usuario que viene en el req.body (previamente validado por el token).

      // 2. Llamamos al método que inserta en DB y nos devuelve el objeto instanciado
      const nuevaMarcacion = await Asistencia.registrar(id_usuario, tipo_marca);
      
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
}

export default new AsistenciaController();