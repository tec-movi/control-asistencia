import { jest } from '@jest/globals';
import Usuario from '../models/Usuario.js';
import db from '../config/Database.js';
import bcrypt from 'bcryptjs';
import UsuarioController from '../controllers/UsuarioController.js';

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('Pruebas Unitarias - Módulo de Usuarios', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Debe crear un usuario correctamente (GU-01)', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([{ insertId: 3, affectedRows: 1 }]);
    
    // Simulamos la creación de un empleado (idRol = 2)
    const resultado = await Usuario.crear('Pedro', 'pedro@empresa.cl', '123456', 2);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain('INSERT INTO usuarios');
    expect(db.query.mock.calls[0][1][0]).toBe(2); // ID de Rol
    expect(db.query.mock.calls[0][1][1]).toBe('Pedro'); // Nombre
    expect(db.query.mock.calls[0][1][2]).toBe('pedro@empresa.cl'); // Email
    expect(resultado[0].insertId).toBe(3);
  });

  it('Debe autenticar un usuario con credenciales válidas', async () => {
    const user = { id_usuario: 4, email: 'ana@empresa.cl', password_hash: 'hash' };
    jest.spyOn(db, 'query').mockResolvedValue([user]);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    await expect(Usuario.autenticar(user.email, 'secreto')).resolves.toEqual(user);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE u.email = ?'), [user.email]);
    expect(bcrypt.compare).toHaveBeenCalledWith('secreto', 'hash');
  });

  it('Debe rechazar credenciales inválidas o usuario inexistente', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([]);
    jest.spyOn(bcrypt, 'compare');

    await expect(Usuario.autenticar('nadie@empresa.cl', 'secreto')).resolves.toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('Debe listar usuarios activos e inactivos con su estado', async () => {
    const users = [
      { id: 1, nombre: 'Ana', activo: 1, estado: 1 },
      { id: 2, nombre: 'Luis', activo: 0, estado: 0 }
    ];
    jest.spyOn(db, 'query').mockResolvedValue(users);

    await expect(Usuario.obtenerTodos()).resolves.toEqual(users);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('u.activo AS estado'));
    expect(db.query.mock.calls[0][0]).not.toContain('WHERE u.activo = 1');
  });

  it('Debe modificar un usuario sin cambiar la contraseña cuando no se envía', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([{ affectedRows: 1 }]);
    jest.spyOn(bcrypt, 'hash');

    await Usuario.modificar(3, 'Pedro actualizado', 'pedro@empresa.cl', 2);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE usuarios SET nombre = ?, email = ?, id_rol = ?'),
      ['Pedro actualizado', 'pedro@empresa.cl', 2, 3]
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('Debe modificar la contraseña cuando se envía', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([{ affectedRows: 1 }]);
    jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash');

    await Usuario.modificar(3, 'Pedro', 'pedro@empresa.cl', 2, 'nueva-clave');

    expect(bcrypt.hash).toHaveBeenCalledWith('nueva-clave', 'salt');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('password_hash = ?'), [
      'Pedro', 'pedro@empresa.cl', 2, 'new-hash', 3
    ]);
  });

  it('Debe eliminar (dar de baja) un usuario correctamente (GU-03)', async () => {
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    // Simulamos que el admin (ID 1) elimina al usuario (ID 3)
    await Usuario.eliminar(3, 1);

    expect(db.query).toHaveBeenCalledTimes(2); 
    expect(db.query.mock.calls[0][0]).toContain('UPDATE usuarios SET activo = 0');
    expect(db.query.mock.calls[0][0]).toContain('AND activo = 1');
    expect(db.query.mock.calls[1][0]).toContain('INSERT INTO usuarios_desactivados');
  });

  it('No debe crear un histórico si el usuario ya estaba inactivo', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({ affectedRows: 0 });

    await expect(Usuario.eliminar(3, 1)).resolves.toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('Debe reactivar un usuario inactivo', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({ affectedRows: 1 });

    await expect(Usuario.activar(3)).resolves.toEqual({ affectedRows: 1 });
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE usuarios SET activo = 1 WHERE id_usuario = ? AND activo = 0',
      [3]
    );
  });
});

describe('Pruebas Unitarias - Controlador de Usuarios', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Debe devolver token y rol ADMIN al iniciar sesión correctamente', async () => {
    const res = responseMock();
    jest.spyOn(Usuario, 'autenticar').mockResolvedValue({
      id_usuario: 1, email: 'admin@empresa.cl', nombre_rol: 'Administrador', nombre: 'Admin'
    });

    await UsuarioController.login({ body: { email: 'admin@empresa.cl', password: '123456' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      token: expect.stringMatching(/^[^.]+\.[^.]+\.[^.]+$/),
      user: { id: 1, email: 'admin@empresa.cl', role: 'ADMIN', name: 'Admin' }
    });
  });

  it('Debe responder 401 con credenciales inválidas', async () => {
    const res = responseMock();
    jest.spyOn(Usuario, 'autenticar').mockResolvedValue(null);

    await UsuarioController.login({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas o usuario inactivo' });
  });

  it('Debe responder 500 si falla la autenticación', async () => {
    const res = responseMock();
    jest.spyOn(Usuario, 'autenticar').mockRejectedValue(new Error('db error'));

    await UsuarioController.login({ body: { email: 'admin@empresa.cl', password: '123456' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });

  it('Debe crear usuario usando name y rol USER por defecto', async () => {
    const res = responseMock();
    jest.spyOn(Usuario, 'crear').mockResolvedValue([]);

    await UsuarioController.create({ body: { name: 'Luis', email: 'luis@empresa.cl', password: '123456' } }, res);

    expect(Usuario.crear).toHaveBeenCalledWith('Luis', 'luis@empresa.cl', '123456', 2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('Debe actualizar, listar y eliminar usuarios con sus respuestas HTTP', async () => {
    const resUpdate = responseMock();
    const resList = responseMock();
    const resDelete = responseMock();
    jest.spyOn(Usuario, 'modificar').mockResolvedValue({ affectedRows: 1 });
    jest.spyOn(Usuario, 'obtenerTodos').mockResolvedValue([{ id: 2 }]);
    jest.spyOn(Usuario, 'eliminar').mockResolvedValue({ affectedRows: 1 });

    await UsuarioController.update({ params: { id: '2' }, body: { nombre: 'Eva', email: 'eva@empresa.cl', role: 'ADMIN' } }, resUpdate);
    await UsuarioController.getAll({}, resList);
    await UsuarioController.delete({ params: { id: '2' }, user: { id: 1 } }, resDelete);

    expect(Usuario.modificar).toHaveBeenCalledWith(2, 'Eva', 'eva@empresa.cl', 1, undefined);
    expect(resList.json).toHaveBeenCalledWith([{ id: 2 }]);
    expect(Usuario.eliminar).toHaveBeenCalledWith(2, 1);
    expect(resUpdate.status).toHaveBeenCalledWith(200);
    expect(resDelete.status).toHaveBeenCalledWith(200);
  });
});