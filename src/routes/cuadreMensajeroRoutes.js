import { Router } from 'express';
import checkAuth from '../middleware/authMiddleware.js';
import {
  obtenerMensajerosPendientes,
  registrarCuadreMensajero,
  obtenerHistorialCuadresMensajero,
  listarAjustes,
  registrarAjuste,
  anularAjuste,
  listarNominas,
  generarNomina,
  marcarNominaPagada,
  anularNomina
} from '../controllers/cuadreMensajeroController.js';

const router = Router();

router.get('/pendientes', checkAuth, obtenerMensajerosPendientes);
router.post('/registrar', checkAuth, registrarCuadreMensajero);
router.get('/historial', checkAuth, obtenerHistorialCuadresMensajero);

router.get('/ajustes', checkAuth, listarAjustes);
router.post('/ajustes', checkAuth, registrarAjuste);
router.put('/ajustes/:id/anular', checkAuth, anularAjuste);

router.get('/nominas', checkAuth, listarNominas);
router.post('/nominas/generar', checkAuth, generarNomina);
router.put('/nominas/:id/marcar-pagado', checkAuth, marcarNominaPagada);
router.put('/nominas/:id/anular', checkAuth, anularNomina);

export default router;