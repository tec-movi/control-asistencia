import db from '../config/Database.js';

class Asistencia {
  constructor({ id, usuario, tipoMarca, fechaHora }) {
    this.id = id;
    this.usuario = usuario;
    this.tipoMarca = tipoMarca;
    this.fechaHora = fechaHora;
  }

  static async registrar(idUsuario, tipoMarca) {
    if (tipoMarca === 'SALIDA') {
      const [entrada] = await db.query(`
        SELECT id_asistencia
        FROM asistencias
        WHERE id_usuario = ?
          AND tipo_marca = 'ENTRADA'
          AND fecha_hora >= CURDATE()
          AND fecha_hora < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        LIMIT 1
      `, [idUsuario]);

      if (!entrada) {
        const error = new Error('No existe una entrada registrada para el día actual');
        error.code = 'ATTENDANCE_ENTRY_REQUIRED';
        throw error;
      }
    }

    const sql = 'INSERT INTO asistencias (id_usuario, tipo_marca) VALUES (?, ?)';
    const result = await db.query(sql, [idUsuario, tipoMarca]);

    return new Asistencia({
      id: result.insertId, // ID autogenerado por MySQL
      usuario: idUsuario,
      tipoMarca: tipoMarca,
      fechaHora: new Date()
    });
  }

  static async obtenerAtrasos() {
    return db.query(`
      SELECT a.id_asistencia AS id, a.id_usuario, u.nombre, u.email,
             a.fecha_hora AS fechaHora, a.fecha_hora AS fecha
      FROM asistencias a
      JOIN usuarios u ON u.id_usuario = a.id_usuario
      WHERE a.tipo_marca = 'ENTRADA' AND a.hora_marca > '09:30:00'
      ORDER BY a.fecha_hora DESC
    `);
  }

  static async obtenerSalidasAnticipadas() {
    return db.query(`
      SELECT a.id_asistencia AS id, a.id_usuario, u.nombre, u.email,
             a.fecha_hora AS fechaHora, a.fecha_hora AS fecha
      FROM asistencias a
      JOIN usuarios u ON u.id_usuario = a.id_usuario
      WHERE a.tipo_marca = 'SALIDA' AND a.hora_marca < '17:30:00'
      ORDER BY a.fecha_hora DESC
    `);
  }

  static async obtenerInasistencias(fecha) {
    return db.query(`
      SELECT u.id_usuario, u.nombre, u.email, ? AS fecha
      FROM usuarios u
      WHERE u.activo = 1
        AND NOT EXISTS (
          SELECT 1
          FROM asistencias a
          WHERE a.id_usuario = u.id_usuario
            AND a.tipo_marca IN ('ENTRADA', 'SALIDA')
            AND a.fecha_hora >= CONCAT(?, ' 00:00:00')
            AND a.fecha_hora < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)
        )
      ORDER BY u.nombre
    `, [fecha, fecha, fecha]);
  }
}

export default Asistencia;