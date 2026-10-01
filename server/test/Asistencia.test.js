import { jest } from '@jest/globals';
import Asistencia from '../models/Asistencia.js';
import db from '../config/Database.js';
import AsistenciaController from '../controllers/AsistenciaController.js';

const responseMock = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('Pruebas Unitarias - Módulo de Asistencia', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Debe registrar una ENTRADA correctamente', async () => {
    // 1. Preparar: Configuramos la respuesta simulada
    jest.spyOn(db, 'query').mockResolvedValue({ insertId: 1 });

    // 2. Ejecutar: Llamamos al modelo
    const resultado = await Asistencia.registrar(1, 'ENTRADA');

    // 3. Validar
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO asistencias (id_usuario, tipo_marca) VALUES (?, ?)',
      [1, 'ENTRADA']
    );
    expect(resultado).toMatchObject({ id: 1, usuario: 1, tipoMarca: 'ENTRADA' });
    expect(resultado.fechaHora).toBeInstanceOf(Date);
  });

  it('Debe registrar una SALIDA correctamente', async () => {
    jest.spyOn(db, 'query').mockResolvedValue({ insertId: 2 });

    const resultado = await Asistencia.registrar(1, 'SALIDA');

    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO asistencias (id_usuario, tipo_marca) VALUES (?, ?)',
      [1, 'SALIDA']
    );
    expect(resultado).toMatchObject({ id: 2, usuario: 1, tipoMarca: 'SALIDA' });
  });
});

describe('Pruebas Unitarias - Controlador de Asistencia', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Debe rechazar una marca sin usuario o tipo', async () => {
    const res = responseMock();

    await AsistenciaController.registrarAsistencia({ body: { id_usuario: 1 } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Faltan datos obligatorios' });
  });

  it('Debe registrar una marca y devolver 201', async () => {
    const res = responseMock();
    jest.spyOn(Asistencia, 'registrar').mockResolvedValue({ tipoMarca: 'ENTRADA', id: 1 });

    await AsistenciaController.registrarAsistencia({ body: { id_usuario: 1, tipo_marca: 'ENTRADA' } }, res);

    expect(Asistencia.registrar).toHaveBeenCalledWith(1, 'ENTRADA');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Registro de ENTRADA exitoso',
      data: { tipoMarca: 'ENTRADA', id: 1 }
    }));
  });

  it('Debe responder 500 cuando falla el registro', async () => {
    const res = responseMock();
    jest.spyOn(Asistencia, 'registrar').mockRejectedValue(new Error('db error'));

    await AsistenciaController.registrarAsistencia({ body: { id_usuario: 1, tipo_marca: 'SALIDA' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});