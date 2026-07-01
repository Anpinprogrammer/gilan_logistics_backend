import { Router } from 'express';
import checkAuth from '../middleware/authMiddleware.js';
import { obtenerResumenDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.get('/resumen', checkAuth, obtenerResumenDashboard);

export default router;