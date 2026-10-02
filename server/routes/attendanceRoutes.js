import { Router } from 'express';
import AsistenciaController from '../controllers/AsistenciaController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/reports/atrasos', requireAuth, requireRole('ADMIN'), AsistenciaController.obtenerReporteAtrasos);
router.get('/reports/salidas-anticipadas', requireAuth, requireRole('ADMIN'), AsistenciaController.obtenerReporteSalidasAnticipadas);
router.get('/reports/inasistencias', requireAuth, requireRole('ADMIN'), AsistenciaController.obtenerReporteInasistencias);
router.get('/reports/:reportType', requireAuth, requireRole('ADMIN'), AsistenciaController.obtenerReporte);
router.post('/', requireAuth, AsistenciaController.registrarAsistencia);

export default router;