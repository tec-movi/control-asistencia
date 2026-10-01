import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController.js';

const router = Router();
router.post('/login', UsuarioController.login);
router.get('/', UsuarioController.getAll);
router.post('/', UsuarioController.create);
router.patch('/:id/activate', UsuarioController.activate);
router.put('/:id', UsuarioController.update);
router.delete('/:id', UsuarioController.delete);

export default router;