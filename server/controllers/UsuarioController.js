import Usuario from '../models/Usuario.js';

class UsuarioController {
  // 1. Iniciar sesión (Login)
  async login(req, res) {
    try {
      const { email, password } = req.body;
      console.log("1. React envió esto:", { email, password }); // Veremos si React manda bien los datos

      const user = await Usuario.autenticar(email, password);
      console.log("2. Resultado de la validación:", user ? "Usuario válido" : "Falló la validación"); 

      if (user) {
        const role = user.nombre_rol === 'Administrador' ? 'ADMIN' : 'USER';
        res.json({ 
          token: 'fake-jwt-token', 
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
      // Aceptamos tanto 'nombre' (Postman) como 'name' (React)
      const { nombre, name, email, role, password } = req.body;
      const nombreFinal = nombre || name;
      
      const idRol = role === 'ADMIN' ? 1 : 2; 
      
      await Usuario.crear(nombreFinal, email, password || '123456', idRol);
      res.status(201).json({ success: true, message: 'Usuario creado exitosamente' });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ error: 'Error al intentar guardar el usuario en la base de datos' });
    }
  }

  // 4. Modificar un usuario existente
  async update(req, res) {
    try {
      // Aceptamos tanto 'nombre' como 'name'
      const { nombre, name, email, role, password } = req.body;
      const nombreFinal = nombre || name;
      
      const idRol = role === 'ADMIN' ? 1 : 2;
      
      await Usuario.modificar(req.params.id, nombreFinal, email, idRol, password);
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
      const idAdminEjecutor = 1; 
      
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