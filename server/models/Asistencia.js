import db from '../config/Database.js';

class Asistencia {
  // Constructor para instanciar el objeto tal como pide la imagen conceptual
  constructor({ id, usuario, tipoMarca, fechaHora }) {
    this.id = id;
    this.usuario = usuario;
    this.tipoMarca = tipoMarca;
    this.fechaHora = fechaHora;
  }

  // Método estático para registrar en la DB y devolver la instancia
  static async registrar(idUsuario, tipoMarca) {
    // Se define la query previniendo inyección SQL (igual a la imagen)
    const sql = 'INSERT INTO asistencias (id_usuario, tipo_marca) VALUES (?, ?)';
    
    // Se guarda el resultado para recuperar el ID ingresado
    const result = await db.query(sql, [idUsuario, tipoMarca]);

    // Se instancia una nueva Asistencia con los datos correspondientes (idéntico a la imagen)
    return new Asistencia({
      id: result.insertId, // ID autogenerado por MySQL
      usuario: idUsuario,
      tipoMarca: tipoMarca,
      fechaHora: new Date()
    });
  }
}

export default Asistencia;