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
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce([{ id_asistencia: 1 }])
      .mockResolvedValueOnce({ insertId: 2 });

    const resultado = await Asistencia.registrar(1, 'SALIDA');

    expect(db.query).toHaveBeenLastCalledWith(
      'INSERT INTO asistencias (id_usuario, tipo_marca) VALUES (?, ?)',
      [1, 'SALIDA']
    );
    expect(resultado).toMatchObject({ id: 2, usuario: 1, tipoMarca: 'SALIDA' });
  });

  it('Debe impedir una SALIDA si no existe ENTRADA del día', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce([]);

    await expect(Asistencia.registrar(1, 'SALIDA')).rejects.toMatchObject({
      code: 'ATTENDANCE_ENTRY_REQUIRED',
    });

    expect(db.query).toHaveBeenCalledTimes(1);
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

    await AsistenciaController.registrarAsistencia(
      { body: { tipo_marca: 'ENTRADA' }, user: { id: 1 } },
      res,
    );

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

    await AsistenciaController.registrarAsistencia(
      { body: { tipo_marca: 'SALIDA' }, user: { id: 1 } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });

  it('Debe responder 409 si se intenta registrar salida sin entrada previa', async () => {
    const res = responseMock();
    const error = new Error('missing entry');
    error.code = 'ATTENDANCE_ENTRY_REQUIRED';
    jest.spyOn(Asistencia, 'registrar').mockRejectedValue(error);

    await AsistenciaController.registrarAsistencia(
      { body: { tipo_marca: 'SALIDA' }, user: { id: 1 } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No puedes registrar la salida sin haber marcado la entrada',
    });
  });

  it('Debe devolver un reporte válido con status 200', async () => {
    const res = responseMock();
    const report = [{ id_usuario: 1, nombre: 'Ana', fecha: '2026-10-01' }];
    jest.spyOn(Asistencia, 'obtenerAtrasos').mockResolvedValue(report);

    await AsistenciaController.obtenerReporte({ params: { reportType: 'atrasos' }, query: {} }, res);

    expect(Asistencia.obtenerAtrasos).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(report);
  });

  it('Debe devolver un arreglo vacío sin error cuando no hay coincidencias', async () => {
    const res = responseMock();
    jest.spyOn(Asistencia, 'obtenerSalidasAnticipadas').mockResolvedValue([]);

    await AsistenciaController.obtenerReporte(
      { params: { reportType: 'salidas-anticipadas' }, query: {} },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('Debe devolver 500 si falla la consulta del reporte', async () => {
    const res = responseMock();
    jest.spyOn(Asistencia, 'obtenerAtrasos').mockRejectedValue(new Error('db error'));

    await AsistenciaController.obtenerReporte({ params: { reportType: 'atrasos' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se pudo obtener el reporte de atrasos' });
  });

  it('Debe rechazar un tipo de reporte no permitido', async () => {
    const res = responseMock();

    await AsistenciaController.obtenerReporte({ params: { reportType: 'otro' }, query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Tipo de reporte no válido' });
  });

  it('Debe validar la fecha del reporte de inasistencias', async () => {
    const res = responseMock();

    await AsistenciaController.obtenerReporte(
      { params: { reportType: 'inasistencias' }, query: { date: '01-10-2026' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'La fecha debe tener el formato YYYY-MM-DD y ser válida',
    });
  });

  it('Debe devolver un arreglo vacío para inasistencias en fin de semana', async () => {
    const res = responseMock();

    await AsistenciaController.obtenerReporte(
      { params: { reportType: 'inasistencias' }, query: { date: '2026-10-03' } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

describe('Pruebas Unitarias - Consultas de Reportes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Debe usar los límites estrictos y excluir colaciones por tipo de marca', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([]);

    await Asistencia.obtenerAtrasos();
    expect(db.query.mock.calls[0][0]).toContain("a.hora_marca > '09:30:00'");
    expect(db.query.mock.calls[0][0]).toContain("a.tipo_marca = 'ENTRADA'");

    await Asistencia.obtenerSalidasAnticipadas();
    expect(db.query.mock.calls[1][0]).toContain("a.hora_marca < '17:30:00'");
    expect(db.query.mock.calls[1][0]).toContain("a.tipo_marca = 'SALIDA'");
  });

  it('Debe clasificar 09:31 como atraso y 09:29 como entrada a tiempo', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([
      { id: 1, id_usuario: 1, fechaHora: '2026-10-01 09:31:00' },
    ]);

    const atrasos = await Asistencia.obtenerAtrasos();

    expect(atrasos).toEqual([
      { id: 1, id_usuario: 1, fechaHora: '2026-10-01 09:31:00' },
    ]);
    expect(db.query.mock.calls[0][0]).toContain("a.hora_marca > '09:30:00'");

    db.query.mockResolvedValueOnce([]);
    const entradasATiempo = await Asistencia.obtenerAtrasos();

    expect(entradasATiempo).toEqual([]);
  });

  it('Debe clasificar una salida a las 17:29 como salida anticipada', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([
      { id: 2, id_usuario: 1, fechaHora: '2026-10-01 17:29:00' },
    ]);

    const salidasAnticipadas = await Asistencia.obtenerSalidasAnticipadas();

    expect(salidasAnticipadas).toEqual([
      { id: 2, id_usuario: 1, fechaHora: '2026-10-01 17:29:00' },
    ]);
    expect(db.query.mock.calls[0][0]).toContain("a.hora_marca < '17:30:00'");
  });

  it('Debe considerar asistencia una entrada o una salida en la fecha indicada', async () => {
    jest.spyOn(db, 'query').mockResolvedValue([]);

    await Asistencia.obtenerInasistencias('2026-10-01');

    expect(db.query.mock.calls[0][0]).toContain("a.tipo_marca IN ('ENTRADA', 'SALIDA')");
    expect(db.query.mock.calls[0][0]).toContain("a.fecha_hora >= CONCAT(?, ' 00:00:00')");
    expect(db.query.mock.calls[0][0]).toContain("a.fecha_hora < DATE_ADD(CONCAT(?, ' 00:00:00'), INTERVAL 1 DAY)");
    expect(db.query.mock.calls[0][1]).toEqual(['2026-10-01', '2026-10-01', '2026-10-01']);
  });
});