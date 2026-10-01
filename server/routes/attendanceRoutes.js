import { Router } from 'express';
import AsistenciaController from '../controllers/AsistenciaController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/reports/:reportType', requireAuth, requireRole('ADMIN'), AsistenciaController.obtenerReporte);
router.post('/', requireAuth, AsistenciaController.registrarAsistencia);

export default router;