import Usuario from '../models/Usuario.js';
import { createToken } from '../middleware/auth.js';

class UsuarioController {
  // 1. Iniciar sesión (Login)
  async login(req, res) {
    try {
      const { email, password } = req.body ?? {};

      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
      }

      const user = await Usuario.autenticar(email.trim().toLowerCase(), password);

      if (user) {
        const role = user.nombre_rol === 'Administrador' ? 'ADMIN' : 'USER';
        res.json({ 
          token: createToken({ id: user.id_usuario, role }),
          user: { id: user.id_usuario, email: user.email, role: role, name: user.nombre } 
        });
      } else {
        res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
      }
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // 2. Obtener la lista de usuarios reales de MySQL
  async getAll(req, res) {
    try {
      const users = await Usuario.obtenerTodos();
      // 'users' ya viene como un arreglo de objetos desde MySQL
      res.status(200).json(users);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ error: 'No se pudo obtener la lista de usuarios' });
    }
  }

  // 3. Crear un nuevo usuario
  async create(req, res) {
    try {
      const { nombre, name, email, role, password } = req.body ?? {};
      const nombreFinal = (nombre || name || '').trim();
      const emailFinal = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!nombreFinal || !emailFinal || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
      }

      const idRol = role === 'ADMIN' ? 1 : 2;
      
      await Usuario.crear(nombreFinal, emailFinal, password, idRol);
      res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ error: 'Error al intentar guardar el usuario en la base de datos' });
    }
  }

  // 4. Modificar un usuario existente
  async update(req, res) {
    try {
      const { nombre, name, email, role, password } = req.body ?? {};
      const nombreFinal = (nombre || name || '').trim();
      const emailFinal = typeof email === 'string' ? email.trim().toLowerCase() : '';

      if (!nombreFinal || !emailFinal) {
        return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
      }
      
      const idRol = role === 'ADMIN' ? 1 : 2;
      
      await Usuario.modificar(req.params.id, nombreFinal, emailFinal, idRol, password);
      res.status(200).json({ success: true, message: 'Usuario actualizado correctamente' });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json({ error: 'Error al modificar el usuario' });
    }
  }
  // 5. Eliminar (desactivar) un usuario
  async delete(req, res) {
    try {
      // Para este prototipo, simulamos que el Admin que ejecuta la acción es el ID 1
      const idAdminEjecutor = req.user?.id || 1;
      
      const result = await Usuario.eliminar(req.params.id, idAdminEjecutor);

      if (!result) {
        return res.status(404).json({ error: 'El usuario ya está inactivo o no existe' });
      }

      res.status(200).json({ success: true, message: 'Usuario dado de baja exitosamente' });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ error: 'Error al intentar dar de baja al usuario' });
    }
  }

  async activate(req, res) {
    try {
      const result = await Usuario.activar(req.params.id);

      if (!result.affectedRows) {
        return res.status(404).json({ error: 'El usuario no está inactivo o no existe' });
      }

      res.status(200).json({ success: true, message: 'Usuario reactivado correctamente' });
    } catch (error) {
      console.error("Error al reactivar usuario:", error);
      res.status(500).json({ error: 'Error al intentar reactivar al usuario' });
    }
  }
}

export default new UsuarioController();