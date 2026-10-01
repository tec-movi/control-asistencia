import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.post('/login', UsuarioController.login);
router.get('/', requireAuth, requireRole('ADMIN'), UsuarioController.getAll);
router.post('/', requireAuth, requireRole('ADMIN'), UsuarioController.create);
router.patch('/:id/activate', requireAuth, requireRole('ADMIN'), UsuarioController.activate);
router.put('/:id', requireAuth, requireRole('ADMIN'), UsuarioController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), UsuarioController.delete);

export default router;