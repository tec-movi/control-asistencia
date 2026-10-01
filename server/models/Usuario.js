import db from '../config/Database.js';
import bcrypt from 'bcryptjs';

class Usuario {
  // Login (Busca al usuario por email)
  async autenticar(email, password) {
    const sql = `SELECT u.*, r.nombre_rol FROM usuarios u 
                 JOIN roles r ON u.id_rol = r.id_rol 
                 WHERE u.email = ? AND u.activo = 1`;
    
    // Obtenemos los resultados
    const filas = await db.query(sql, [email]);
    const usuarioEncontrado = filas[0];
    
    if (usuarioEncontrado) {
      // Verificamos si la contraseña coincide
      const claveCorrecta = await bcrypt.compare(password, usuarioEncontrado.password_hash);
      if (claveCorrecta) {
        return usuarioEncontrado;
      }
    }
    return null;
  }

  // GU-01: Crear Usuario
  async crear(nombre, email, password, idRol) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const sql = 'INSERT INTO usuarios (id_rol, nombre, email, password_hash) VALUES (?, ?, ?, ?)';
    return await db.query(sql, [idRol, nombre, email, hash]);
  }

  // Listar Usuarios para el Dashboard Admin
  async obtenerTodos() {
    const sql = `SELECT u.id_usuario as id, u.nombre, u.email, r.nombre_rol as rol,
                        u.activo, u.activo AS estado
                 FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol`;
    return await db.query(sql);
  }

  // GU-02: Modificar Usuario
  async modificar(id, nombre, email, idRol, password) {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const sql = 'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ?, password_hash = ? WHERE id_usuario = ?';
      return await db.query(sql, [nombre, email, idRol, hash, id]);
    }

    const sql = 'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ? WHERE id_usuario = ?';
    return await db.query(sql, [nombre, email, idRol, id]);
  }

  // GU-03: Eliminar Usuario (Baja lógica)
  async eliminar(idUsuario, idAdmin) {
    const resultado = await db.query(
      'UPDATE usuarios SET activo = 0 WHERE id_usuario = ? AND activo = 1',
      [idUsuario]
    );

    if (!resultado.affectedRows) {
      return null;
    }

    const sqlBaja = `INSERT INTO usuarios_desactivados (id_usuario, id_administrador, motivo)
                     VALUES (?, ?, ?)`;
    return await db.query(sqlBaja, [idUsuario, idAdmin, 'Eliminado por administrador']);
  }

  async activar(idUsuario) {
    return await db.query(
      'UPDATE usuarios SET activo = 1 WHERE id_usuario = ? AND activo = 0',
      [idUsuario]
    );
  }
}
export default new Usuario();