import { Router } from 'express';
import AsistenciaController from '../controllers/AsistenciaController.js';

const router = Router();

// Ruta POST para registrar asistencia
// Se enlaza el método del controlador a esta ruta
router.post('/', AsistenciaController.registrarAsistencia);

export default router;