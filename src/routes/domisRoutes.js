import { Router } from "express";
import {
    ingresarDomi,
    listarDomis,
    actualizarEstadoDomi,
    actualizarDomi,
    buscarDomi,
    eliminarDomi
} from '../controllers/domisController.js'
import checkAuth from "../middleware/authMiddleware.js";

const router = Router()

router.post('/ingresar-domi', checkAuth, ingresarDomi)
router.get('/listar-domis', checkAuth, listarDomis)
router.put('/actualizar-domi/:id', checkAuth, actualizarDomi)
router.put('/actualizar-estado-domi/:id', checkAuth, actualizarEstadoDomi)
router.get('/buscar-domi/:id', checkAuth, buscarDomi)
router.delete('/eliminar-domi/:id', checkAuth, eliminarDomi)

export default router